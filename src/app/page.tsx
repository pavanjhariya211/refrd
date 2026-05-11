import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_REFERRER_FIELDS } from '@/lib/constants'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { JobCard } from '@/components/ui/JobCard'
import type { JobPost } from '@/types'

export const dynamic = 'force-dynamic'

const HERO_STEPS = [
  'Place Bid',
  'AI Scores',
  'Top Bids Reviewed',
  'Referral or Refund',
] as const

const MOCK_SCORE_ROWS = [
  { label: 'Skills match', value: 85 },
  { label: 'Experience match', value: 70 },
  { label: 'Profile completeness', value: 72 },
  { label: 'Overall', value: 78 },
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

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-4 py-32 sm:py-40 reveal-stagger">
          <h1
            className="text-paper font-extrabold leading-[1.05] tracking-tight"
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
            }}
          >
            Get referred by a{' '}
            <span className="text-accent">verified</span>{' '}
            employee.
            <br />
            <span className="text-accent">Bid.</span> Be reviewed first.
          </h1>

          {/* Step flow */}
          <div className="mt-10 flex flex-col gap-3 text-[11px] uppercase tracking-widest text-muted sm:flex-row sm:items-center sm:gap-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {HERO_STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-4">
                <span>{step}</span>
                {i < HERO_STEPS.length - 1 && (
                  <span className="text-accent hidden sm:inline">→</span>
                )}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/jobs">
              <Button size="lg">
                Browse open roles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/post-job">
              <Button size="lg" variant="secondary">
                Post a job &amp; earn
              </Button>
            </Link>
          </div>

          {/* Trust bar */}
          <p
            className="mt-8 text-[11px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', color: '#666' }}
          >
            Secured by Razorpay &nbsp;·&nbsp; Full refund if not selected &nbsp;·&nbsp; AI-scored transparency
          </p>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* ─── ACTIVE AUCTIONS ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-32">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2
                className="text-paper font-bold accent-underline"
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                  lineHeight: 1.1,
                }}
              >
                Active auctions
              </h2>
              <span
                className="inline-flex items-center gap-1.5 ml-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                <span className="text-[11px] uppercase tracking-widest text-accent">
                  Live
                </span>
              </span>
            </div>
            <p className="mt-5 text-[13px] text-muted">
              Highest bids get reviewed first.
            </p>
          </div>
          <Link
            href="/jobs"
            className="hidden text-[12px] uppercase tracking-widest text-paper hover:text-accent transition-colors sm:inline"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            View all →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="mt-10 card text-center text-[13px] text-muted">
            No active jobs yet. Be the first to{' '}
            <Link href="/post-job" className="text-accent hover:underline">
              post a role
            </Link>
            .
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <div className="border-t border-line" />

      {/* ─── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-32">
        <h2
          className="text-paper font-bold accent-underline"
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
            lineHeight: 1.1,
          }}
        >
          How it works
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {/* Step 1 */}
          <HowStep
            n={1}
            title="Bid to apply"
            description="Upload your resume, place a bid, pay upfront. Higher bids are reviewed first — pure auction, no tiers."
          />

          {/* Step 2 — with static score breakdown card */}
          <div className="relative">
            <HowStep
              n={2}
              title="AI scores both sides"
              description="A full match breakdown — visible to both you and the referrer. No information asymmetry."
            />
            <div className="mt-6 bg-card border border-line p-4">
              <p
                className="text-[10px] uppercase tracking-widest text-accent"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Example score breakdown
              </p>
              <div className="mt-3 space-y-2.5">
                {MOCK_SCORE_ROWS.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[12px] text-muted"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {row.label}
                      </span>
                      <span
                        className="text-[12px] text-paper"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {row.value}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-[2px] bg-line">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <HowStep
            n={3}
            title="Referred or refunded"
            description="Referrer uploads proof of submission and earns the payout. If they decline or don't act in 7 days, you get refunded automatically."
          />
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-[11px] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <Link href="/for-job-seekers" className="text-paper hover:text-accent transition-colors">
            Full guide for job seekers →
          </Link>
          <span className="text-faint">·</span>
          <Link href="/for-referrers" className="text-paper hover:text-accent transition-colors">
            Full guide for referrers →
          </Link>
        </div>
      </section>

      {/* ─── TRUST STRIP ───────────────────────────────────────────── */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-3 md:gap-0">
            <TrustItem
              title="Refund Guaranteed"
              description="Full refund if the referrer declines or doesn't respond in 7 days."
              first
            />
            <TrustItem
              title="Razorpay Secured"
              description="Every payment is held until proof of referral lands."
            />
            <TrustItem
              title="AI Score Transparent"
              description="Both sides see the same breakdown. No information asymmetry."
              last
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function HowStep({
  n,
  title,
  description,
}: {
  n: number
  title: string
  description: string
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute -top-6 left-0 select-none text-[80px] font-black leading-none"
        style={{
          fontFamily: 'var(--font-syne)',
          color: '#1A1A1A',
        }}
      >
        {n.toString().padStart(2, '0')}
      </span>
      <div className="relative pt-6">
        <h3
          className="text-paper font-bold"
          style={{ fontFamily: 'var(--font-syne)', fontSize: '18px' }}
        >
          {title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
    </div>
  )
}

function TrustItem({
  title,
  description,
  first,
  last,
}: {
  title: string
  description: string
  first?: boolean
  last?: boolean
}) {
  return (
    <div
      className={
        'flex flex-col items-center text-center px-6 md:px-8 ' +
        (first
          ? 'border-b border-line pb-8 md:border-b-0 md:pb-0'
          : last
            ? 'border-t border-line pt-8 md:border-t-0 md:border-l md:pt-0'
            : 'border-y border-line py-8 md:border-y-0 md:border-l md:py-0')
      }
    >
      <p
        className="text-[12px] uppercase tracking-widest text-paper"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {title}
      </p>
      <p className="mt-2 max-w-xs text-[12px] text-muted leading-relaxed">
        {description}
      </p>
    </div>
  )
}
