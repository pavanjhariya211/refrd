import Link from 'next/link'
import { ArrowRight, Trophy, Wallet, Sparkles, ShieldCheck, BadgeCheck, ScrollText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_REFERRER_FIELDS } from '@/lib/constants'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { JobCard } from '@/components/ui/JobCard'
import type { JobPost } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createClient()
  const { data: jobsData } = await supabase
    .from('job_posts')
    .select(`*, referrer:profiles!referrer_id(${PUBLIC_REFERRER_FIELDS})`)
    .eq('status', 'active')
    .order('current_highest_bid', { ascending: false })
    .limit(6)
  const jobs = (jobsData as unknown as JobPost[]) ?? []

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <span className="pill bg-brand-100 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Pay only when you&apos;re shortlisted
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Get referred by a verified employee.
            <br className="hidden md:block" />
            <span className="text-primary"> Bid. Be reviewed first.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Refrd is a competitive auction marketplace. Job seekers bid for referrals.
            Highest bids are reviewed first. Full refund if you&apos;re not selected.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/jobs">
              <Button size="lg">
                Browse open roles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/post-job">
              <Button size="lg" variant="outline">
                Post a job &amp; earn
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4 text-sm">
            <div className="card text-left">
              <Trophy className="mb-2 h-5 w-5 text-warning" />
              <h3 className="font-semibold text-slate-900">Highest bid first</h3>
              <p className="text-xs text-slate-600">Pure auction. No tiers.</p>
            </div>
            <div className="card text-left">
              <Wallet className="mb-2 h-5 w-5 text-success" />
              <h3 className="font-semibold text-slate-900">Pay on apply</h3>
              <p className="text-xs text-slate-600">Refund if not chosen.</p>
            </div>
            <div className="card text-left">
              <Sparkles className="mb-2 h-5 w-5 text-primary" />
              <h3 className="font-semibold text-slate-900">AI score, fully visible</h3>
              <p className="text-xs text-slate-600">Both sides see everything.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Active auctions</h2>
            <p className="text-sm text-slate-600">Top live roles, sorted by current highest bid.</p>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-primary hover:underline">
            View all jobs →
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="card text-center text-sm text-slate-600">
            No active jobs yet. Be the first to{' '}
            <Link href="/post-job" className="font-semibold text-primary">post a role</Link>.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-extrabold">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-card bg-slate-800 p-6">
              <ScrollText className="h-6 w-6 text-accent" />
              <h3 className="mt-3 text-lg font-semibold">1. Bid to apply</h3>
              <p className="mt-1 text-sm text-slate-300">
                Upload your resume, place a bid, and pay upfront. Higher bids are reviewed first.
              </p>
            </div>
            <div className="rounded-card bg-slate-800 p-6">
              <BadgeCheck className="h-6 w-6 text-accent" />
              <h3 className="mt-3 text-lg font-semibold">2. AI scores both sides</h3>
              <p className="mt-1 text-sm text-slate-300">
                A full Claude-powered match score — both you and the referrer see the breakdown.
              </p>
            </div>
            <div className="rounded-card bg-slate-800 p-6">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <h3 className="mt-3 text-lg font-semibold">3. Get referred or refunded</h3>
              <p className="mt-1 text-sm text-slate-300">
                Referrer pays out instantly if they refer you. If they decline, you get refunded.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
