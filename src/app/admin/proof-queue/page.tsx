import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { AdminProofQueueClient, type AdminProofRow } from './AdminProofQueueClient'
import { PROOFS_BUCKET } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function AdminProofQueuePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/proof-queue')
  if (!isAdmin(user.id)) {
    // 404 instead of 403 so we don't even confirm the route exists.
    notFound()
  }

  // Service role so we can read all proofs across users.
  const service = createServiceClient()
  const { data } = await service
    .from('referral_proofs')
    .select(
      'id, application_id, referrer_id, proof_path, proof_url, status, ocr_extracted_company, ocr_extracted_candidate, ocr_sender, ocr_reasoning, ocr_model, created_at, application:applications!application_id(bid_amount, cover_note, applicant:profiles!applicant_id(name, email, linkedin_url), job:job_posts!job_id(title, company_name)), referrer:profiles!referrer_id(name, email, company_name)'
    )
    .in('status', ['needs_review', 'rejected'])
    .order('created_at', { ascending: true })

  // Re-sign every proof URL so previews don't break when admins arrive after
  // the original upload's TTL expired. 1-hour TTL is fine for a review session.
  const rows: AdminProofRow[] = []
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const path = row.proof_path as string
    const { data: signed } = await service.storage
      .from(PROOFS_BUCKET)
      .createSignedUrl(path, 60 * 60)
    rows.push({
      ...(row as unknown as AdminProofRow),
      proof_url: signed?.signedUrl ?? (row.proof_url as string),
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-text">Proof review queue</h1>
            <p className="text-sm text-text-soft">
              {rows.length} item{rows.length === 1 ? '' : 's'} awaiting decision.
              Approving releases the referrer&apos;s payout. Rejecting refunds the
              seeker.
            </p>
          </div>
        </div>
        <AdminProofQueueClient initialRows={rows} />
      </main>
      <Footer />
    </div>
  )
}
