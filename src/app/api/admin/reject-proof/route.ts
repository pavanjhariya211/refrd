import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { sendEmail, emailLayout } from '@/lib/email'
import { formatINR } from '@/lib/utils'

export const runtime = 'nodejs'

/**
 * Admin-only. Marks a referral_proof rejected and triggers a Razorpay
 * refund to the seeker by invoking the existing /api/payments/refund
 * route with the cron bearer token (which already accepts that path).
 *
 * Idempotent — re-running on an already-rejected proof is a no-op.
 */
export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const proof_id = body?.proof_id as string | undefined
  const reason = (body?.reason as string | undefined)?.trim() || 'Admin rejected proof.'
  if (!proof_id) {
    return NextResponse.json({ error: 'Missing proof_id' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: proof, error: pErr } = await service
    .from('referral_proofs')
    .select(
      'id, application_id, referrer_id, status, application:applications!application_id(bid_amount, applicant:profiles!applicant_id(name, email), job:job_posts!job_id(title, company_name)), referrer:profiles!referrer_id(email, name)'
    )
    .eq('id', proof_id)
    .single()
  if (pErr || !proof) {
    return NextResponse.json({ error: 'Proof not found' }, { status: 404 })
  }
  if (proof.status === 'rejected') {
    return NextResponse.json({ status: 'rejected', alreadyRejected: true })
  }

  // Mark rejected.
  await service
    .from('referral_proofs')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      ocr_reasoning: `Admin rejection: ${reason}`,
    })
    .eq('id', proof_id)

  // Refund the seeker. /api/payments/refund accepts the cron bearer header
  // for non-cookie auth, which is the easiest way to call it server-to-server.
  const refundUrl = new URL('/api/payments/refund', request.url).toString()
  const refundRes = await fetch(refundUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({
      application_id: proof.application_id,
      reason: `Admin rejected referral proof: ${reason}`,
    }),
  })
  if (!refundRes.ok) {
    const text = await refundRes.text().catch(() => '')
    return NextResponse.json(
      {
        error:
          'Proof rejected but refund failed — check Razorpay dashboard. ' + text,
      },
      { status: 500 }
    )
  }

  const application = proof.application as unknown as {
    bid_amount: number
    applicant: { name?: string; email?: string }
    job: { title: string; company_name: string }
  }
  const referrer = proof.referrer as unknown as { email?: string; name?: string }

  if (application.applicant?.email) {
    void sendEmail({
      to: application.applicant.email,
      subject: `Your bid for ${application.job.title} was refunded`,
      html: emailLayout(`
        <p>Hi ${application.applicant.name ?? 'there'},</p>
        <p>The referrer's proof for <strong>${application.job.title}</strong> at <strong>${application.job.company_name}</strong> couldn't be verified.</p>
        <p>We've refunded your bid of <strong>${formatINR(application.bid_amount)}</strong> to your original payment method. It should appear in 3–5 business days.</p>
      `),
    })
  }
  if (referrer?.email) {
    void sendEmail({
      to: referrer.email,
      subject: `Referral proof rejected for ${application.job.title}`,
      html: emailLayout(`
        <p>Hi ${referrer.name ?? 'there'},</p>
        <p>We weren't able to verify your screenshot for <strong>${application.applicant.name ?? 'the candidate'}</strong> on <strong>${application.job.title}</strong>.</p>
        <p>Reason: ${reason}</p>
        <p>The seeker has been refunded. If this was a mistake, contact support.</p>
      `),
    })
  }

  return NextResponse.json({ status: 'rejected' })
}
