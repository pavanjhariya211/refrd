import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_REFERRER_FIELDS } from '@/lib/constants'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { SeekerDashboardClient } from './SeekerDashboardClient'
import type { Application } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SeekerDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard/seeker')

  const { data: apps } = await supabase
    .from('applications')
    .select(
      `id, job_id, applicant_id, resume_url, cover_note, linkedin_url, portfolio_url, status, bid_amount, payment_status, match_score, match_grade, referrer_notes, created_at, updated_at,
      job:job_posts!job_id(*, referrer:profiles!referrer_id(${PUBLIC_REFERRER_FIELDS})),
      match:match_scores(*)`
    )
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900">My applications</h1>
        <p className="text-sm text-slate-600">
          Track bids, AI score, and rank. Refunds appear automatically.
        </p>
        <SeekerDashboardClient applications={(apps as unknown as Application[]) ?? []} />
      </main>
      <Footer />
    </div>
  )
}
