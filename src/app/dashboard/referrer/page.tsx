import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Briefcase, Users, Wallet, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { formatINR, formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ReferrerDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard/referrer')

  const [{ data: jobs }, { data: wallet }] = await Promise.all([
    supabase
      .from('job_posts')
      .select('id, title, status, applications_count, current_highest_bid, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('referrer_wallets')
      .select('balance, total_earned')
      .eq('referrer_id', user.id)
      .maybeSingle(),
  ])

  const totalApps = jobs?.reduce((acc, j) => acc + (j.applications_count ?? 0), 0) ?? 0
  const activeJobs = jobs?.filter((j) => j.status === 'active').length ?? 0

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-text">Referrer dashboard</h1>
            <p className="text-sm text-text-soft">Track your jobs, applicants, and earnings.</p>
          </div>
          <Link href="/post-job">
            <Button>
              <Plus className="h-4 w-4" /> Post a job
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="card">
            <Briefcase className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-extrabold">{activeJobs}</p>
            <p className="text-xs text-text-faint">Active jobs</p>
          </div>
          <div className="card">
            <Users className="h-5 w-5 text-success" />
            <p className="mt-2 text-2xl font-extrabold">{totalApps}</p>
            <p className="text-xs text-text-faint">Total applicants</p>
          </div>
          <Link href="/dashboard/referrer/wallet" className="card card-hover">
            <Wallet className="h-5 w-5 text-warning" />
            <p className="mt-2 text-2xl font-extrabold">{formatINR(wallet?.balance ?? 0)}</p>
            <p className="text-xs text-text-faint">Wallet balance</p>
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-text">Your jobs</h2>
          {!jobs?.length ? (
            <div className="card text-center text-sm text-text-soft">
              You haven&apos;t posted any jobs yet.{' '}
              <Link href="/post-job" className="font-semibold text-primary">
                Post your first job →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/dashboard/referrer/${j.id}/applicants`}
                  className="card card-hover flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-text">{j.title}</h3>
                    <p className="text-xs text-text-faint">
                      {j.status} · posted {formatRelativeTime(j.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-bold">{j.applications_count}</p>
                      <p className="text-xs text-text-faint">applicants</p>
                    </div>
                    {j.current_highest_bid > 0 && (
                      <div className="text-right">
                        <p className="font-bold text-warning">{formatINR(j.current_highest_bid)}</p>
                        <p className="text-xs text-text-faint">highest bid</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
