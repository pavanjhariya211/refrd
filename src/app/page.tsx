import Link from 'next/link'
import { ArrowRight, Shield, Clock, Eye, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_REFERRER_FIELDS } from '@/lib/constants'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/JsonLd'
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonld'
import type { JobPost } from '@/types'
import { JobAuctionCard, ScoreGradientDef } from './_home/HomeBlocks'
import { HomeFaq } from './_home/HomeFaq'

export const dynamic = 'force-dynamic'

const HOW_STEPS = [
  {
    n: '01',
    title: 'Place a bid, safely',
    body: 'Your money is held safely with Razorpay. The referrer can see you’ve bid, but they can’t touch the money yet.',
    bold: 'held safely with Razorpay',
  },
  {
    n: '02',
    title: 'See your match score',
    body: 'Our AI scores how well you fit the role. You and the referrer see the exact same score — no hidden math.',
    bold: 'You and the referrer see the exact same score',
  },
  {
    n: '03',
    title: 'Get referred with proof',
    body: 'The referrer has 7 days to refer you through their company’s system and upload a screenshot or proof.',
    bold: '7 days to refer you through their company’s system',
  },
  {
    n: '04',
    title: 'Paid or refunded',
    body: 'Proof checks out → referrer gets paid. No proof, declined, or 7 days up? You get every rupee back, automatically.',
    bold: 'You get every rupee back, automatically.',
  },
] as const

const SCORE_ROWS = [
  { label: 'Skills match', value: 85, alt: false },
  { label: 'Experience match', value: 70, alt: true },
  { label: 'Profile completeness', value: 72, alt: false },
  { label: 'Keyword overlap', value: 64, alt: true },
] as const

const FAQS = [
  {
    q: 'Isn’t paying for a referral just a scam waiting to happen?',
    a: 'On sites without protection, yes — totally. Ours works differently. Your money sits with Razorpay (the same payment company that handles checkout on most Indian websites you use). The referrer can’t touch it until they upload proof that they actually referred you through their company’s system. No proof in 7 days? Money comes straight back to you, no support ticket needed. You’re not paying for hope — you’re paying for a real, documented referral.',
  },
  {
    q: 'How do you actually check the referrer works at the company?',
    a: 'Before anyone can list a role, they have to verify with their company work email — not a personal Gmail. We check that the email domain matches the company they say they work for. If they leave the company, their listings come down.',
  },
  {
    q: 'What if the referrer’s company doesn’t allow paid referrals?',
    a: 'Some companies don’t allow employees to take money for referrals. We require every referrer to confirm their company allows this before they can list a role. That responsibility sits with them, not you. Paying through Refrd is actually safer than doing a back-channel cash deal because there’s a record and you can get refunded.',
  },
  {
    q: 'If I bid higher, am I guaranteed to get referred?',
    a: 'No, and anyone promising that is lying. Higher bids show up at the top of the referrer’s queue, so they look at you first. But referrers can still say no if you’re a bad fit. Since they see your match score, throwing a high bid at a role you don’t fit is wasted. If they decline, you get refunded.',
  },
  {
    q: 'How does Refrd make money?',
    a: 'We take a small platform fee, but only when a referral actually happens — the exact amount is shown before you confirm your bid, with no surprises later. If you’re not selected and get refunded, the only thing withheld is a flat ₹10 processing fee that covers the payment gateway’s non-refundable transaction charge; the rest of your bid comes straight back to you.',
  },
  {
    q: 'Will the referrer see who I am before I bid?',
    a: 'Yes, they see your profile and your match score — that’s the whole point. A blind referral helps nobody. If you’re worried about your current employer noticing, you can hide your profile from public search.',
  },
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
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <ScoreGradientDef />
      <Navbar />

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="relative pb-20 pt-24 text-center sm:pt-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto inline-flex items-center gap-2.5 rounded-pill border border-border-hi bg-white/[0.04] py-1 pl-1.5 pr-3.5 text-[13px] text-text-soft backdrop-blur-sm">
            <span
              className="rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              100% refund promise
            </span>
            You only pay if you get referred.
          </div>

          <h1 className="mx-auto mt-8 max-w-5xl text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[64px] md:text-[80px]">
            Skip the ATS black hole.
            <br />
            Bid for a <span className="accent-italic">direct referral.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-[19px] leading-[1.55] text-text-soft">
            Pay a real employee at your dream company to refer you. We hold your
            money safely with Razorpay — they only get paid after they actually
            refer you and show proof. No proof in 7 days? You get every rupee
            back, automatically.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/jobs">
              <Button size="lg">
                Browse open roles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how">
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </Link>
          </div>

          {/* Trust ribbon */}
          <div
            className="mx-auto mt-16 grid max-w-5xl overflow-hidden rounded-card border border-border md:grid-cols-4"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
          >
            <TrustItem
              icon={<Shield className="h-4 w-4" />}
              label="Money is safe"
              value="Razorpay"
              sub="protected"
            />
            <TrustItem
              icon={<Clock className="h-4 w-4" />}
              label="Refund window"
              value="7 days"
              sub="automatic"
            />
            <TrustItem
              icon={<Eye className="h-4 w-4" />}
              label="Match score"
              value="Open"
              sub="to both sides"
            />
            <TrustItem
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Referrers"
              value="Verified"
              sub="work email"
            />
          </div>
        </div>
      </section>

      {/* ─── LIVE AUCTIONS ───────────────────────────────────────── */}
      {jobs.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="section-meta">01 · Live now</div>
                <h2 className="mt-4 text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px] md:text-[56px]">
                  Roles open for{' '}
                  <span className="accent-italic">bidding.</span>
                </h2>
              </div>
              <Link href="/jobs">
                <Button variant="outline">
                  View all roles <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.map((j, i) => (
                <JobAuctionCard key={j.id} job={j} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how" className="py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="section-meta">02 · How it works</div>
          <h2 className="mx-auto mt-4 max-w-3xl text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px] md:text-[56px]">
            A risk-free system built on{' '}
            <span className="accent-italic">absolute trust.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-text-soft">
            Most “pay for a referral” sites are a leap of faith. We removed the
            leap. Here’s the full flow.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-7xl gap-5 px-4 md:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((s) => (
            <div key={s.n} className="card card-hover">
              <div className="font-serif text-[52px] italic leading-none accent-italic">
                {s.n}
              </div>
              <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.015em]">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-text-soft">
                {s.body.split(s.bold).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <strong className="font-semibold text-text">{s.bold}</strong>
                    )}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        {/* Escrow promise block */}
        <div className="mx-auto mt-16 max-w-7xl px-4">
          <div
            className="relative grid items-center gap-14 overflow-hidden rounded-[20px] border border-border-hi p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]"
            style={{
              background:
                'linear-gradient(180deg, rgba(29, 22, 53, 0.8) 0%, rgba(22, 16, 41, 0.5) 100%)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-[20%] -top-1/2 h-[500px] w-[500px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h3 className="text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-[32px]">
                So what’s the{' '}
                <span className="accent-italic">actual promise</span>?
              </h3>
              <p className="mt-4 text-[15px] leading-[1.65] text-text-soft">
                We don’t promise you’ll get hired — no referral service can do
                that honestly. What we{' '}
                <strong className="font-semibold text-text">do</strong> promise:
                if the referrer doesn’t actually refer you (and show proof)
                within 7 days, you get every rupee back.
              </p>
              <p className="mt-4 text-[15px] leading-[1.65] text-text-soft">
                <strong className="font-semibold text-text">
                  That’s the only thing we charge for: a real referral with
                  proof.
                </strong>{' '}
                The interview and the offer depend on you and the company. We
                just open the door.
              </p>
            </div>

            <div
              className="relative rounded-[12px] border border-border p-6 font-mono text-[12.5px]"
              style={{ background: 'rgba(10, 6, 18, 0.6)' }}
            >
              <FlowRow label="You place a bid" value="₹2,500 held safely" />
              <FlowRow label="Referrer accepts" value="money still locked" />
              <FlowRow label="Match score shown" value="to both sides" />
              <FlowRow label="You’re referred" value="proof uploaded" />
              <FlowRow label="Proof verified" value="referrer paid ✓" success />
            </div>
          </div>
        </div>
      </section>

      {/* ─── AUDIENCE SPLIT ──────────────────────────────────────── */}
      <section id="for-referrers" className="py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="section-meta">03 · Two sides, one ledger</div>
          <h2 className="mx-auto mt-4 max-w-3xl text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px] md:text-[56px]">
            Built for the person{' '}
            <span className="accent-italic">asking</span> and the one{' '}
            <span className="accent-italic">vouching.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-text-soft">
            A marketplace only works when both sides feel safe. Here’s what each
            side gets.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-7xl gap-5 px-4 lg:grid-cols-2">
          <SplitPanel
            tag="For job seekers"
            heading={
              <>
                Stop cold-DMing strangers on{' '}
                <span className="accent-italic">LinkedIn.</span>
              </>
            }
            body="Your resume vanishes into the ATS black hole. Refrd is a direct line to someone whose internal referral actually gets read — and you only pay if it actually happens."
            tone="violet"
            bullets={[
              ['Real employees only.', 'Every referrer is checked with their work email before they can list a role.'],
              ['See your fit score before bidding.', 'If you’re not a strong match, you’ll know. So will they.'],
              ['Refund without arguing.', 'No referral in 7 days? Money comes back on its own.'],
            ]}
            cta={{ href: '/jobs', label: 'Browse open roles', variant: 'primary' }}
          />
          <SplitPanel
            tag="For referrers"
            heading={
              <>
                Get paid for what you already{' '}
                <span className="accent-italic">do for free.</span>
              </>
            }
            body="You already get LinkedIn messages asking for referrals. Refrd lets you post the openings you know about, choose the candidates worth your time, and earn for every one you actually refer."
            tone="pink"
            bullets={[
              ['You decide who gets your referral.', 'See match scores upfront. Accept only the bids that meet your bar.'],
              ['Paid after you refer.', 'Submit via your company’s system, upload the proof, get paid.'],
              ['Your company’s rules matter.', 'Check your employer allows paid referrals before you list. We require you to confirm.'],
            ]}
            cta={{ href: '/post-job', label: 'Start earning', variant: 'outline' }}
          />
        </div>
      </section>

      {/* ─── AI SCORE ────────────────────────────────────────────── */}
      <section className="relative py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(168, 85, 247, 0.04) 50%, transparent 100%)',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <div className="section-meta">04 · Transparent matching</div>
            <h2 className="mt-4 text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px] md:text-[56px]">
              Same score. <span className="accent-italic">Both sides.</span> No
              mystery math.
            </h2>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-text-soft">
              A common trick on paid-referral sites: the referrer takes your
              money, then quietly drops you saying you weren’t a “fit.” We don’t
              allow that. The match score is calculated once, shown to both of
              you, and locked in before any bid is accepted.
            </p>
            <div className="mt-7">
              <Link href="/for-job-seekers">
                <Button variant="outline">
                  How we calculate scores <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div
            className="rounded-[20px] border border-border-hi p-9"
            style={{
              background:
                'linear-gradient(180deg, rgba(29, 22, 53, 0.9) 0%, rgba(22, 16, 41, 0.7) 100%)',
              boxShadow:
                '0 0 0 1px rgba(168, 85, 247, 0.15), 0 40px 60px -20px rgba(0, 0, 0, 0.5), 0 0 80px -20px rgba(168, 85, 247, 0.3)',
            }}
          >
            <div className="mb-8 flex items-start justify-between gap-5 border-b border-border pb-6">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-text-faint">
                  Sample · Role match
                </div>
                <div className="mt-2 text-[22px] font-semibold tracking-[-0.015em]">
                  Senior Backend Engineer
                </div>
                <div className="mt-1 text-[13px] text-text-soft">
                  Stripe · Bengaluru · 5–7 yrs
                </div>
              </div>
              <ScoreRing pct={78} />
            </div>
            {SCORE_ROWS.map((row) => (
              <div key={row.label} className="mb-[18px] last:mb-0">
                <div className="mb-2 flex justify-between text-[13px] text-text-soft">
                  <span>{row.label}</span>
                  <span className="font-mono font-semibold text-text">
                    {row.value}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${row.value}%`,
                      background: row.alt
                        ? 'linear-gradient(90deg, #6366f1 0%, #c084fc 100%)'
                        : 'linear-gradient(90deg, #a855f7 0%, #c084fc 100%)',
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-6 flex justify-between border-t border-border pt-5 text-xs text-text-faint">
              <span>
                <span className="visible-dot mr-1.5" />
                Visible to <strong className="font-semibold text-text">you</strong>
              </span>
              <span>
                <span className="visible-dot mr-1.5" />
                Visible to{' '}
                <strong className="font-semibold text-text">referrer</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="section-meta">05 · Questions we’d ask</div>
          <h2 className="mx-auto mt-4 max-w-3xl text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px] md:text-[56px]">
            The <span className="accent-italic">awkward</span> questions,
            answered straight.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-text-soft">
            If you’re skeptical, good. Read these before you bid.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl px-4">
          <HomeFaq items={[...FAQS]} />
        </div>
      </section>

      {/* ─── CLOSING ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div
            className="relative overflow-hidden rounded-[24px] border border-border-hi px-6 py-20 text-center sm:px-12"
            style={{
              background:
                'linear-gradient(180deg, rgba(29, 22, 53, 0.9) 0%, rgba(10, 6, 18, 0.6) 100%)',
              boxShadow:
                '0 0 0 1px rgba(168, 85, 247, 0.15), 0 60px 80px -30px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: [
                  'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(168, 85, 247, 0.3), transparent 60%)',
                  'radial-gradient(ellipse 40% 40% at 80% 100%, rgba(236, 72, 153, 0.18), transparent 60%)',
                ].join(','),
              }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-balance text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px] md:text-[64px]">
                The hardest part of a job search is the part{' '}
                <span className="accent-italic">nobody could buy.</span> Until
                now.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-soft">
                Place your first bid. If you don’t actually get referred within
                7 days, every rupee comes back. No support tickets, no chasing,
                no arguing.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/jobs">
                  <Button size="lg">
                    Browse open roles <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/post-job">
                  <Button size="lg" variant="outline">
                    I can refer for a role
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

// ─── Small in-file components ──────────────────────────────────

function TrustItem({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div
      className="p-6 text-left"
      style={{ background: 'rgba(22, 16, 41, 0.6)' }}
    >
      <div className="mb-2 flex items-center gap-2 text-violet-bright">
        {icon}
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-faint">
          {label}
        </span>
      </div>
      <div className="text-lg font-semibold tracking-tight">
        {value}{' '}
        <span className="text-xs font-normal text-text-faint">{sub}</span>
      </div>
    </div>
  )
}

function FlowRow({
  label,
  value,
  success,
}: {
  label: string
  value: string
  success?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-border py-3 text-text-soft last:border-b-0">
      <span className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: success ? '#10b981' : '#c084fc',
            boxShadow: success
              ? '0 0 10px #10b981'
              : '0 0 10px rgba(192,132,252,0.8)',
          }}
        />
        {label}
      </span>
      <span
        className="font-medium"
        style={{ color: success ? '#10b981' : '#f4f1fa' }}
      >
        {value}
      </span>
    </div>
  )
}

function SplitPanel({
  tag,
  heading,
  body,
  tone,
  bullets,
  cta,
}: {
  tag: string
  heading: React.ReactNode
  body: string
  tone: 'violet' | 'pink'
  bullets: ReadonlyArray<readonly [string, string]>
  cta: { href: string; label: string; variant: 'primary' | 'outline' }
}) {
  const checkBg =
    tone === 'violet'
      ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'
      : 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
  const blob = tone === 'violet' ? '#a855f7' : '#ec4899'
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-border p-10"
      style={{
        background:
          'linear-gradient(180deg, rgba(29, 22, 53, 0.6) 0%, rgba(22, 16, 41, 0.4) 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: blob }}
      />
      <div className="relative">
        <span className="mb-5 inline-flex rounded-pill border border-border bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-text-faint">
          {tag}
        </span>
        <h3 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.025em]">
          {heading}
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-text-soft">{body}</p>
        <ul className="mt-7">
          {bullets.map(([title, detail]) => (
            <li
              key={title}
              className="flex items-start gap-3.5 border-b border-border py-3.5 last:border-b-0"
            >
              <span
                className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: checkBg, boxShadow: `0 0 12px ${blob}66` }}
              >
                ✓
              </span>
              <div className="text-sm text-text">
                <strong className="font-semibold">{title}</strong>{' '}
                <span className="font-normal text-text-soft">{detail}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link href={cta.href}>
            <Button variant={cta.variant}>
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function ScoreRing({ pct }: { pct: number }) {
  // Circumference of an r=40 circle is ~251.2. We offset the dash
  // to leave (100 - pct)% of the ring as the empty track.
  const dashOffset = 251.2 * (1 - pct / 100)
  return (
    <div className="relative h-[90px] w-[90px] shrink-0">
      <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
        <circle
          cx="45"
          cy="45"
          r="40"
          fill="none"
          strokeWidth="6"
          className="stroke-border"
        />
        <circle
          cx="45"
          cy="45"
          r="40"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke="url(#scoreGrad)"
          strokeDasharray="251.2"
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[28px] font-bold leading-none tracking-[-0.02em] accent-italic">
            {pct}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-text-faint">
            Match
          </div>
        </div>
      </div>
    </div>
  )
}
