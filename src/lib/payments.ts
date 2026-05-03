import type { SupabaseClient } from '@supabase/supabase-js'
import { calculatePlatformFee, calculateReferrerPayout } from '@/lib/scoring'

// Result returned by releasePayout for the caller to surface to the UI.
export interface PayoutReleaseResult {
  payout: number
  platform_fee: number
}

/**
 * Releases the payment escrowed on an application:
 *  - applies the platform fee
 *  - credits the referrer's wallet
 *  - bumps profile referral counters
 *  - flips the application status to 'referred' and inserts a referrals row
 *
 * Caller must use a service-role client because we reach into wallets and
 * profiles regardless of RLS. Caller is also responsible for confirming
 * the referrer owns the job (for direct release) OR that an approved
 * referral_proof exists (for the proof-gated path).
 */
export async function releasePayout(
  service: SupabaseClient,
  args: {
    applicationId: string
    referrerId: string
    notes?: string | null
  }
): Promise<PayoutReleaseResult> {
  const { data: app, error: appErr } = await service
    .from('applications')
    .select('id, bid_amount, payment_status, status')
    .eq('id', args.applicationId)
    .single()
  if (appErr || !app) throw new Error('Application not found')
  if (app.status === 'referred') {
    // Idempotent — caller may retry; nothing to do.
    const { data: payment } = await service
      .from('payments')
      .select('platform_fee, referrer_payout')
      .eq('application_id', args.applicationId)
      .single()
    return {
      payout: payment?.referrer_payout ?? 0,
      platform_fee: payment?.platform_fee ?? 0,
    }
  }

  const { data: payment } = await service
    .from('payments')
    .select('id, status, amount')
    .eq('application_id', args.applicationId)
    .single()
  if (!payment) throw new Error('No payment record')
  if (payment.status !== 'captured') throw new Error('Payment not captured')

  const platform_fee = calculatePlatformFee(payment.amount)
  const referrer_payout = calculateReferrerPayout(payment.amount)

  await service
    .from('payments')
    .update({ platform_fee, referrer_payout })
    .eq('id', payment.id)

  // Ensure wallet exists before crediting it.
  const { data: wallet } = await service
    .from('referrer_wallets')
    .select('id, balance, total_earned')
    .eq('referrer_id', args.referrerId)
    .maybeSingle()

  let walletId = wallet?.id
  let currentBalance = wallet?.balance ?? 0
  let currentEarned = wallet?.total_earned ?? 0
  if (!walletId) {
    const { data: created } = await service
      .from('referrer_wallets')
      .insert({ referrer_id: args.referrerId, balance: 0, total_earned: 0 })
      .select('id, balance, total_earned')
      .single()
    walletId = created?.id
    currentBalance = created?.balance ?? 0
    currentEarned = created?.total_earned ?? 0
    if (!walletId) throw new Error('Could not create wallet')
  }

  await service
    .from('referrer_wallets')
    .update({
      balance: currentBalance + referrer_payout,
      total_earned: currentEarned + referrer_payout,
      updated_at: new Date().toISOString(),
    })
    .eq('id', walletId)

  await service.from('wallet_transactions').insert({
    wallet_id: walletId,
    type: 'credit',
    amount: referrer_payout,
    reference_id: args.applicationId,
    description: `Referral payout (proof verified)`,
  })

  await service
    .from('applications')
    .update({ status: 'referred', referrer_notes: args.notes ?? null })
    .eq('id', args.applicationId)

  await service.from('referrals').insert({
    application_id: args.applicationId,
    referrer_id: args.referrerId,
    notes: args.notes ?? null,
  })

  // Bump referrer profile stats.
  const { data: prof } = await service
    .from('profiles')
    .select('total_referrals, successful_referrals')
    .eq('id', args.referrerId)
    .single()
  await service
    .from('profiles')
    .update({
      total_referrals: (prof?.total_referrals ?? 0) + 1,
      successful_referrals: (prof?.successful_referrals ?? 0) + 1,
    })
    .eq('id', args.referrerId)

  return { payout: referrer_payout, platform_fee }
}
