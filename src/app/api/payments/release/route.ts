import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { releasePayout } from '@/lib/payments'

export const runtime = 'nodejs'

/**
 * Direct payout release. Kept for admin/manual use only — the seeker-facing
 * referrer flow goes through /api/referrals/submit-proof now, which gates
 * release on an approved referral_proof. This route still requires the
 * caller to be the job's referrer AND for an approved proof to exist.
 */
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
    .select('id, job:job_posts!job_id(referrer_id)')
    .eq('id', application_id)
    .single()
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const job = app.job as unknown as { referrer_id: string }
  if (job.referrer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Gate: an approved referral_proof must exist before we release payout.
  const { data: proof } = await service
    .from('referral_proofs')
    .select('status')
    .eq('application_id', application_id)
    .maybeSingle()
  if (!proof || proof.status !== 'approved') {
    return NextResponse.json(
      { error: 'Approved referral proof required before payout' },
      { status: 412 }
    )
  }

  try {
    const result = await releasePayout(service, {
      applicationId: application_id,
      referrerId: user.id,
      notes,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payout failed' },
      { status: 500 }
    )
  }
}
