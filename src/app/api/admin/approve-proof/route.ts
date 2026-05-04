import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { releasePayout } from '@/lib/payments'
import { isAdmin } from '@/lib/admin'
import { sendEmail, emailLayout } from '@/lib/email'
import { formatINR } from '@/lib/utils'

export const runtime = 'nodejs'

/**
 * Admin-only. Marks a referral_proof approved and releases payout to the
 * referrer. Idempotent — re-running on an already-approved proof is a no-op.
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
  const note = body?.note as string | undefined
  if (!proof_id) {
    return NextResponse.json({ error: 'Missing proof_id' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: proof, error: pErr } = await service
    .from('referral_proofs')
    .select(
      'id, application_id, referrer_id, status, application:applications!application_id(applicant:profiles!applicant_id(name, email), job:job_posts!job_id(title, company_name)), referrer:profiles!referrer_id(email, name)'
    )
    .eq('id', proof_id)
    .single()
  if (pErr || !proof) {
    return NextResponse.json({ error: 'Proof not found' }, { status: 404 })
  }
  if (proof.status === 'approved') {
    return NextResponse.json({ status: 'approved', alreadyApproved: true })
  }

  // Mark approved first; payout happens next. If payout fails we revert.
  await service
    .from('referral_proofs')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      ocr_reasoning:
        note?.trim()
          ? `Admin approval: ${note.trim()}`
          : 'Admin approval (manual review).',
    })
    .eq('id', proof_id)

  let payout: number
  try {
    const result = await releasePayout(service, {
      applicationId: proof.application_id,
      referrerId: proof.referrer_id,
      notes: note?.trim() || 'Approved by admin after manual proof review.',
    })
    payout = result.payout
  } catch (err) {
    // Roll back so the queue knows this still needs admin attention.
    await service
      .from('referral_proofs')
      .update({
        status: 'needs_review',
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq('id', proof_id)
    return NextResponse.json(
      {
        error:
          'Payout failed: ' +
          (err instanceof Error ? err.message : 'unknown error'),
      },
      { status: 500 }
    )
  }

  // Notify both sides — fire-and-forget; errors logged but don't fail the request.
  const application = proof.application as unknown as {
    applicant: { name?: string; email?: string }
    job: { title: string; company_name: string }
  }
  const referrer = proof.referrer as unknown as { email?: string; name?: string }

  if (referrer?.email) {
    void sendEmail({
      to: referrer.email,
      subject: `Your referral was approved — ${formatINR(payout)} added to your wallet`,
      html: emailLayout(`
        <p>Hi ${referrer.name ?? 'there'},</p>
        <p>We verified your referral confirmation for <strong>${application.applicant.name ?? 'the candidate'}</strong> on <strong>${application.job.title}</strong>.</p>
        <p>Your payout of <strong>${formatINR(payout)}</strong> has been credited to your Refrd wallet.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/referrer/wallet" style="color:#1A56DB">View wallet →</a></p>
      `),
    })
  }
  if (application.applicant?.email) {
    void sendEmail({
      to: application.applicant.email,
      subject: `You've been referred to ${application.job.company_name}`,
      html: emailLayout(`
        <p>Hi ${application.applicant.name ?? 'there'},</p>
        <p>Good news — the referrer for <strong>${application.job.title}</strong> at <strong>${application.job.company_name}</strong> has confirmed your referral and submitted you on their internal system.</p>
        <p>Watch your inbox for the company's next steps.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/seeker" style="color:#1A56DB">View applications →</a></p>
      `),
    })
  }

  return NextResponse.json({ status: 'approved', payout })
}
