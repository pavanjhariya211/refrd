import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Authorize: either the job's referrer (with cookie) or the cron (with bearer secret).
  const auth = request.headers.get('authorization')
  const isCron = auth === `Bearer ${process.env.CRON_SECRET}`
  if (!user && !isCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const application_id = body?.application_id as string
  const reason = body?.reason as string | undefined
  if (!application_id) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })

  const service = createServiceClient()

  const { data: app } = await service
    .from('applications')
    .select('id, applicant_id, bid_amount, payment_status, job:job_posts!job_id(referrer_id, title)')
    .eq('id', application_id)
    .single()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const job = app.job as unknown as { referrer_id: string; title: string }
  if (!isCron && user && job.referrer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: payment } = await service
    .from('payments')
    .select('id, status, razorpay_payment_id, amount')
    .eq('application_id', application_id)
    .single()
  if (!payment) return NextResponse.json({ error: 'No payment' }, { status: 404 })
  if (payment.status === 'refunded') {
    return NextResponse.json({ refunded: true, alreadyRefunded: true })
  }
  if (payment.status !== 'captured') {
    return NextResponse.json({ error: 'Payment not captured' }, { status: 400 })
  }

  let refundId: string | null = null
  try {
    const razorpay = getRazorpay()
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id!, {
      amount: payment.amount * 100,
      notes: { application_id, reason: reason ?? 'declined' },
    })
    refundId = refund.id
  } catch (err) {
    console.error('Razorpay refund failed:', err)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }

  await service
    .from('payments')
    .update({
      status: 'refunded',
      refund_id: refundId,
      refund_initiated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  await service
    .from('applications')
    .update({
      status: 'rejected',
      payment_status: 'refunded',
      referrer_notes: reason ?? null,
    })
    .eq('id', application_id)

  return NextResponse.json({ refunded: true, refundId })
}
