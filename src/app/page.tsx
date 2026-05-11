import Link from 'next/link'
import {
  ArrowRight,
  Trophy,
  Wallet,
  Sparkles,
  Target,
  Bot,
  Eye,
  Coins,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_REFERRER_FIELDS } from '@/lib/constants'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { JobCard } from '@/components/ui/JobCard'
import type { JobPost } from '@/types'

export const dynamic = 'force-dynamic'

const HOW_STEPS = [
  {
    n: '01',
    title: 'Bid to Apply',
    description:
      'Upload your resume, place a bid, pay upfront. Higher bids float to the top of the review queue.',
    Icon: Target,
    iconClass: 'bg-orange-100 text-orange-600',
  },
  {
    n: '02',
    title: 'AI Scores Both Sides',
    description:
      'Full match score — skills, experience, profile completeness. Both you and the referrer see the same breakdown.',
    Icon: Bot,
    iconClass: 'bg-violet-100 text-violet-600',
  },
  {
    n: '03',
    title: 'Get Reviewed First',
    description:
      'The verified employee reviews top bids. Your AI score and profile are front and center — no mystery criteria.',
    Icon: Eye,
    iconClass: 'bg-purple-100 text-purple-600',
  },
  {
    n: '04',
    title: 'Referral or Refund',
    description:
      'Referred? The employee earns only after proof of referral. Declined or 7 days pass? Full refund, no questions.',
    Icon: Coins,
    iconClass: 'bg-emerald-100 text-emerald-600',
  },
] as const

const SCORE_ROWS = [
  { label: 'Skills Match', value: 85, bar: 'bg-amber-400' },
  { label: 'Experience Match', value: 70, bar: 'bg-emerald-400' },
  { label: 'Profile Completeness', value: 72, bar: 'bg-sky-400' },
  { label: 'Overall Match', value: 78, bar: 'bg-amber-400' },
] as const

export default async function HomePage() {
  const supabase = createClient()
  const { data: jobsData } = await supabase
    .from('job_posts')
    .select(`*, referrer:profiles!referrer_id(${PUBLIC_REFERRER_FIELDS})`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4)
  const jobs = (jobsData as unknown as JobPost[]) ?? []

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ─── HERO ────────────────────────────────────────────────── */}
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

      {/* ─── ACTIVE AUCTIONS ────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Active auctions</h2>
            <p className="text-sm text-slate-600">The latest live roles. Bid, get reviewed first.</p>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* ─── HOW IT WORKS — 4-card light grid ─────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Simple. Fair. Transparent.
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map(({ n, title, description, Icon, iconClass }) => (
            <div
              key={n}
              className="relative overflow-hidden card card-hover"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-2 select-none text-6xl font-extrabold leading-none text-slate-100"
              >
                {n}
              </span>
              <div
                className={
                  'relative inline-flex h-10 w-10 items-center justify-center rounded-card ' +
                  iconClass
                }
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-5 text-lg font-bold text-slate-900">
                {title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── POWERED BY AI — dark contrast block ─────────────── */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left column: copy + CTAs */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Powered by AI
              </p>
              <h2 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Both sides see
                <br />
                the{' '}
                <span className="italic text-amber-300">same</span>{' '}
                score.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">
                No hidden criteria. No mystery. Our AI generates a full match
                breakdown visible to both job seekers and referrers — before
                any bid is accepted.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/for-job-seekers">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10"
                  >
                    See how scoring works
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                  >
                    Browse jobs
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right column: example score card */}
            <div className="lg:pl-8">
              <div className="rounded-card border border-slate-800 bg-slate-950/60 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Example score
                  </p>
                  <span className="rounded-card bg-amber-300 px-3 py-1 text-base font-extrabold text-slate-900">
                    78%
                  </span>
                </div>
                <div className="mt-6 space-y-5">
                  {SCORE_ROWS.map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {row.label}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {row.value}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-pill bg-slate-800">
                        <div
                          className={'h-full ' + row.bar}
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-widest text-slate-500">
                  Example — your score varies by role
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="/for-job-seekers"
              className="font-semibold text-amber-300 hover:underline"
            >
              Full guide for job seekers →
            </Link>
            <span className="text-slate-600">·</span>
            <Link
              href="/for-referrers"
              className="font-semibold text-amber-300 hover:underline"
            >
              Full guide for referrers →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
