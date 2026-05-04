import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { APPLY_AUTO_REFUND_DAYS } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 60

const REJECTED_PROOF_RETRY_DAYS = 3 // referrer had time to retry; refund seeker

/**
 * Daily cron entry point. Refunds seekers in three stuck states:
 *   1. Application paid, no referrer action at all, > 7 days old.
 *   2. Referrer submitted proof, OCR routed to needs_review, > 7 days
 *      since submission (admin never cleared it from /admin/proof-queue).
 *   3. Referrer submitted proof, OCR rejected, > 3 days since submission
 *      (referrer didn't retry with a clearer screenshot).
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = Date.now()
  const cutoff7d = new Date(now - APPLY_AUTO_REFUND_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const cutoff3d = new Date(now - REJECTED_PROOF_RETRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const ids = new Set<string>()
  const reasonById: Record<string, string> = {}

  // Case 1 — paid + applied + >7d old, no proof submitted at all.
  const { data: noAction } = await service
    .from('applications')
    .select('id')
    .eq('payment_status', 'paid')
    .eq('status', 'applied')
    .lt('created_at', cutoff7d)
  for (const r of noAction ?? []) {
    ids.add(r.id)
    reasonById[r.id] = `auto-refund: no referrer action in ${APPLY_AUTO_REFUND_DAYS} days`
  }

  // Cases 2 + 3 — proofs that have been stuck.
  const { data: stuckProofs } = await service
    .from('referral_proofs')
    .select('application_id, status, created_at, application:applications!application_id(payment_status, status)')
    .in('status', ['needs_review', 'rejected'])
  for (const proof of (stuckProofs ?? []) as unknown as Array<{
    application_id: string
    status: 'needs_review' | 'rejected'
    created_at: string
    application: { payment_status: string; status: string }
  }>) {
    if (
      proof.application?.payment_status !== 'paid' ||
      proof.application?.status === 'referred'
    ) continue
    const cutoff = proof.status === 'rejected' ? cutoff3d : cutoff7d
    if (proof.created_at >= cutoff) continue
    if (ids.has(proof.application_id)) continue
    ids.add(proof.application_id)
    reasonById[proof.application_id] =
      proof.status === 'rejected'
        ? `auto-refund: rejected proof not retried within ${REJECTED_PROOF_RETRY_DAYS} days`
        : `auto-refund: needs_review proof not cleared by admin within ${APPLY_AUTO_REFUND_DAYS} days`
  }

  if (ids.size === 0) return NextResponse.json({ refunded: 0 })

  let count = 0
  for (const application_id of ids) {
    try {
      const url = new URL('/api/payments/refund', request.url).toString()
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({
          application_id,
          reason: reasonById[application_id],
        }),
      })
      if (res.ok) count++
    } catch (err) {
      console.error('auto-refund failed for', application_id, err)
    }
  }

  return NextResponse.json({ refunded: count, scanned: ids.size })
}

export const POST = GET
