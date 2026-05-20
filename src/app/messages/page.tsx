import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { MessagesClient } from './MessagesClient'

export const dynamic = 'force-dynamic'

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { application_id?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/messages')

  // Get all applications the user is part of (as applicant or job referrer)
  const [appsAsApplicant, jobs] = await Promise.all([
    supabase
      .from('applications')
      .select('id, status, bid_amount, job:job_posts!job_id(id, title, company_name, referrer_id)')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('job_posts')
      .select('id, title, company_name')
      .eq('referrer_id', user.id),
  ])

  const referrerJobIds = (jobs.data ?? []).map((j) => j.id)
  const appsAsReferrer = referrerJobIds.length
    ? await supabase
        .from('applications')
        .select(
          'id, status, bid_amount, applicant:profiles!applicant_id(id, name, profile_photo, headline), job:job_posts!job_id(id, title, company_name, referrer_id)'
        )
        .in('job_id', referrerJobIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-2xl font-extrabold text-text">Messages</h1>
        <MessagesClient
          userId={user.id}
          asApplicant={(appsAsApplicant.data as unknown as any[]) ?? []}
          asReferrer={(appsAsReferrer.data as unknown as any[]) ?? []}
          initialApplicationId={searchParams.application_id}
        />
      </main>
      <Footer />
    </div>
  )
}
