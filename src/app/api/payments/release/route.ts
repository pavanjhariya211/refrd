import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculatePlatformFee, calculateReferrerPayout } from '@/lib/scoring'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const application_id = body?.application_id as string
  const notes = body?.notes as string | undefined
  if (!application_id) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })

  const service = createServiceClient()

  const { data: app } = await service
    .from('applications')
    .select(
      'id, applicant_id, bid_amount, payment_status, status, job:job_posts!job_id(id, title, referrer_id)'
    )
    .eq('id', application_id)
    .single()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const job = app.job as unknown as { id: string; title: string; referrer_id: string }
  if (job.referrer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: payment } = await service
    .from('payments')
    .select('id, status, amount')
    .eq('application_id', application_id)
    .single()
  if (!payment || payment.status !== 'captured') {
    return NextResponse.json({ error: 'No captured payment' }, { status: 400 })
  }

  const platform_fee = calculatePlatformFee(payment.amount)
  const referrer_payout = calculateReferrerPayout(payment.amount)

  await service
    .from('payments')
    .update({ platform_fee, referrer_payout })
    .eq('id', payment.id)

  // Ensure wallet exists
  const { data: wallet } = await service
    .from('referrer_wallets')
    .select('id, balance, total_earned')
    .eq('referrer_id', user.id)
    .maybeSingle()

  let walletId = wallet?.id
  if (!walletId) {
    const { data: created } = await service
      .from('referrer_wallets')
      .insert({ referrer_id: user.id, balance: 0, total_earned: 0 })
      .select('id, balance, total_earned')
      .single()
    walletId = created?.id
    if (!walletId) return NextResponse.json({ error: 'Wallet error' }, { status: 500 })
  }

  await service
    .from('referrer_wallets')
    .update({
      balance: (wallet?.balance ?? 0) + referrer_payout,
      total_earned: (wallet?.total_earned ?? 0) + referrer_payout,
      updated_at: new Date().toISOString(),
    })
    .eq('id', walletId)

  await service.from('wallet_transactions').insert({
    wallet_id: walletId,
    type: 'credit',
    amount: referrer_payout,
    reference_id: application_id,
    description: `Referral: ${job.title}`,
  })

  await service
    .from('applications')
    .update({ status: 'referred', referrer_notes: notes ?? null })
    .eq('id', application_id)

  await service.from('referrals').insert({
    application_id,
    referrer_id: user.id,
    notes: notes ?? null,
  })

  // Bump referrer profile stats
  const { data: prof } = await service
    .from('profiles')
    .select('total_referrals, successful_referrals')
    .eq('id', user.id)
    .single()
  await service
    .from('profiles')
    .update({
      total_referrals: (prof?.total_referrals ?? 0) + 1,
      successful_referrals: (prof?.successful_referrals ?? 0) + 1,
    })
    .eq('id', user.id)

  return NextResponse.json({ payout: referrer_payout, platform_fee })
}
