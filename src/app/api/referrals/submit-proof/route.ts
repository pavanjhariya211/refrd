import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { releasePayout } from '@/lib/payments'
import { PROOFS_BUCKET } from '@/lib/constants'
import { sendEmail, emailLayout } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const VISION_MODEL = 'gpt-4o-mini'

interface SubmitBody {
  application_id?: string
  proof_path?: string  // storage path inside PROOFS_BUCKET
}

interface OcrDecision {
  decision: 'approved' | 'needs_review' | 'rejected'
  extracted_company: string | null
  extracted_candidate: string | null
  sender: string | null
  reasoning: string
}

function normalise(text: string | null | undefined): string {
  return (text ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as SubmitBody | null
  if (!body?.application_id || !body?.proof_path) {
    return NextResponse.json(
      { error: 'Missing application_id or proof_path' },
      { status: 400 }
    )
  }

  const service = createServiceClient()

  // Verify the caller is the job's referrer for this application.
  const { data: app } = await service
    .from('applications')
    .select(
      'id, applicant_id, status, payment_status, job:job_posts!job_id(id, company_name, referrer_id), applicant:profiles!applicant_id(name)'
    )
    .eq('id', body.application_id)
    .single()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const job = app.job as unknown as { id: string; company_name: string; referrer_id: string }
  if (job.referrer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (app.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Application not in paid state' }, { status: 400 })
  }
  if (app.status === 'referred') {
    return NextResponse.json({ error: 'Already referred' }, { status: 409 })
  }

  // Idempotency — if a proof exists already for this application, return its
  // current state instead of running OCR a second time.
  const { data: existing } = await service
    .from('referral_proofs')
    .select('id, status')
    .eq('application_id', body.application_id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ status: existing.status, alreadySubmitted: true })
  }

  const applicant = app.applicant as unknown as { name: string | null }
  const candidateName = applicant?.name ?? ''
  const expectedCompany = job.company_name ?? ''

  // Generate a short-lived signed URL OpenAI's servers will fetch.
  const { data: signed, error: signedErr } = await service.storage
    .from(PROOFS_BUCKET)
    .createSignedUrl(body.proof_path, 60 * 10) // 10 minutes
  if (signedErr || !signed?.signedUrl) {
    console.error('[submit-proof] could not sign proof URL:', signedErr)
    return NextResponse.json(
      {
        error: `Sign proof URL failed: ${signedErr?.message ?? 'unknown error'}`,
      },
      { status: 500 }
    )
  }

  // ─── OCR + analysis ──────────────────────────────────────────────────────
  let ocr: OcrDecision
  try {
    const completion = await openai.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You analyse screenshots of internal-ATS referral confirmation emails. Always respond with a single JSON object — no preamble, no markdown.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This screenshot should be a referral confirmation email from a company's internal ATS (Greenhouse, Lever, Workday, Workable, Ashby, etc.) or from the company directly.

Expected:
- Candidate referred: "${candidateName}"
- Company: "${expectedCompany}"

Decide:
- "approved" — the email clearly confirms a referral, the candidate name AND company match (semantic match is fine: "Pavan Jhariya" ≈ "Pavan", "Publicis Groupe" ≈ "Publicis").
- "needs_review" — looks like a referral email but candidate or company is unclear / partial match / unknown sender.
- "rejected" — clearly not a referral confirmation (random screenshot, blank, unrelated email).

Respond with JSON exactly matching:
{
  "decision": "approved" | "needs_review" | "rejected",
  "extracted_company": "<company name as it appears on the email, or null>",
  "extracted_candidate": "<candidate name as it appears on the email, or null>",
  "sender": "<sender email or domain, or null>",
  "reasoning": "<one sentence justifying the decision>"
}`,
            },
            { type: 'image_url', image_url: { url: signed.signedUrl } },
          ],
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    ocr = JSON.parse(raw) as OcrDecision
  } catch (err) {
    console.error('[submit-proof] OCR call failed:', err)
    // Fail-safe: queue for manual review rather than reject a possibly-good
    // submission because of a transient API error.
    ocr = {
      decision: 'needs_review',
      extracted_company: null,
      extracted_candidate: null,
      sender: null,
      reasoning:
        err instanceof Error
          ? `OCR call failed: ${err.message}`
          : 'OCR call failed (unknown error)',
    }
  }

  // ─── Sanity checks on the OCR decision ───────────────────────────────────
  // Even if OCR says approved, double-check the company and candidate look
  // right. Defence-in-depth against a hallucinated "approved".
  let finalDecision = ocr.decision
  if (finalDecision === 'approved') {
    const companyMatch =
      !!ocr.extracted_company &&
      normalise(ocr.extracted_company).includes(normalise(expectedCompany).split(' ')[0])
    const candidateMatch =
      !candidateName ||
      (!!ocr.extracted_candidate &&
        normalise(ocr.extracted_candidate).includes(normalise(candidateName).split(' ')[0]))
    if (!companyMatch || !candidateMatch) {
      finalDecision = 'needs_review'
      ocr.reasoning =
        (ocr.reasoning || 'auto-approved by model') +
        ' — downgraded to needs_review: company/candidate did not pass server-side check'
    }
  }

  // ─── Persist proof + (on approve) release the payout ─────────────────────
  const proofRow = {
    application_id: body.application_id,
    referrer_id: user.id,
    proof_url: signed.signedUrl,
    proof_path: body.proof_path,
    status: finalDecision,
    ocr_extracted_company: ocr.extracted_company,
    ocr_extracted_candidate: ocr.extracted_candidate,
    ocr_sender: ocr.sender,
    ocr_reasoning: ocr.reasoning,
    ocr_model: VISION_MODEL,
  }
  const { error: insertErr } = await service.from('referral_proofs').insert(proofRow)
  if (insertErr) {
    // Surface the actual Postgres error so the toast tells us whether the
    // referral_proofs table is missing, an RLS policy rejected the write,
    // a constraint failed, etc. Pure config issues are way easier to fix
    // when the database tells us its own complaint verbatim.
    console.error('[submit-proof] insert proof failed:', insertErr)
    return NextResponse.json(
      { error: `Save proof failed: ${insertErr.message ?? 'unknown error'}` },
      { status: 500 }
    )
  }

  if (finalDecision === 'approved') {
    try {
      const result = await releasePayout(service, {
        applicationId: body.application_id,
        referrerId: user.id,
        notes: `Auto-approved by OCR: ${ocr.reasoning}`,
      })
      return NextResponse.json({ status: 'approved', ...result })
    } catch (err) {
      console.error('[submit-proof] payout release failed after approve:', err)
      // Approval stood; payout failed. Roll proof back to needs_review so an
      // admin can sort it out without double-paying.
      await service
        .from('referral_proofs')
        .update({
          status: 'needs_review',
          ocr_reasoning:
            (ocr.reasoning || '') +
            ' — payout failed, downgraded to needs_review: ' +
            (err instanceof Error ? err.message : 'unknown'),
        })
        .eq('application_id', body.application_id)
      return NextResponse.json(
        { error: 'Proof approved but payout failed; admin will review' },
        { status: 500 }
      )
    }
  }

  // needs_review or rejected — no payout. Email any admins so the queue
  // doesn't sit unattended; falls back to a no-op log if email isn't
  // configured or no admins are listed.
  if (finalDecision === 'needs_review') {
    const adminIds = (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (adminIds.length > 0) {
      const { data: admins } = await service
        .from('profiles')
        .select('email')
        .in('id', adminIds)
      const adminEmails = (admins ?? [])
        .map((a) => a.email as string | null)
        .filter((e): e is string => !!e)
      if (adminEmails.length > 0) {
        const queueUrl =
          (process.env.NEXT_PUBLIC_APP_URL ?? '') + '/admin/proof-queue'
        void sendEmail({
          to: adminEmails,
          subject: `Proof needs review — ${expectedCompany}`,
          html: emailLayout(`
            <p>A referral proof was uploaded that the OCR could not auto-approve.</p>
            <p><strong>Candidate:</strong> ${candidateName || '—'}<br/>
               <strong>Company:</strong> ${expectedCompany || '—'}<br/>
               <strong>OCR reason:</strong> ${ocr.reasoning}</p>
            <p><a href="${queueUrl}" style="color:#1A56DB">Open review queue →</a></p>
          `),
        })
      }
    }
  }

  return NextResponse.json({ status: finalDecision, reasoning: ocr.reasoning })
}
