import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { ApplicantsKanban } from './ApplicantsKanban'
import type { Application } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ApplicantsPage({ params }: { params: { jobId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: job } = await supabase
    .from('job_posts')
    .select('id, title, company_name, referrer_id, applications_count, current_highest_bid, min_bid')
    .eq('id', params.jobId)
    .single()
  if (!job) notFound()
  if (job.referrer_id !== user.id) redirect('/dashboard/referrer')

  const { data: applications } = await supabase
    .from('applications')
    .select(
      `id, job_id, applicant_id, resume_url, cover_note, linkedin_url, portfolio_url, status, bid_amount, payment_status, match_score, match_grade, referrer_notes, created_at, updated_at,
      applicant:profiles!applicant_id(id, name, headline, profile_photo, linkedin_url, skills),
      match:match_scores(*)`
    )
    .eq('job_id', params.jobId)
    .eq('payment_status', 'paid')
    .order('bid_amount', { ascending: false })

  const apps = (applications as unknown as Application[]) ?? []

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-600">
            {apps.length} applicants · highest bid currently:&nbsp;
            {job.current_highest_bid > 0 ? `₹${job.current_highest_bid.toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
        <ApplicantsKanban applications={apps} jobId={job.id} jobTitle={job.title} />
      </main>
      <Footer />
    </div>
  )
}
