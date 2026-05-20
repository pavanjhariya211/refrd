import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Trophy,
  BadgeCheck,
  Linkedin,
  FileSearch,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/JsonLd'
import { faqPageJsonLd } from '@/lib/jsonld'
import { FREE_MATCH_CHECK_LIMIT, APPLY_AUTO_REFUND_DAYS } from '@/lib/constants'

const FAQS = [
  {
    question: 'How does Refrd work for job seekers?',
    answer:
      'Refrd is a competitive auction marketplace for job referrals. You browse open roles, place a bid, and pay upfront. Higher bids are reviewed first by the verified employee who posted the job. If they refer you, the referral is confirmed with proof. If they decline or do not act, you get a full refund.',
  },
  {
    question: 'How much does it cost to apply for a referral?',
    answer:
      'You choose your own bid amount — there are no fixed fees or tiers. The job lists a minimum bid; you can bid that or higher. Higher bids are reviewed first. The amount is fully refundable if you are not selected.',
  },
  {
    question: 'What happens if I am not selected?',
    answer:
      `You get a full refund. If the referrer declines, the refund is processed immediately. If the referrer does not respond within ${APPLY_AUTO_REFUND_DAYS} days, Refrd refunds you automatically. Payments are held securely through Razorpay until a referral is confirmed.`,
  },
  {
    question: 'Can I see my AI match score before paying?',
    answer:
      `Yes. Refrd gives you up to ${FREE_MATCH_CHECK_LIMIT} free Quick Match checks each month. You upload your resume and get the same AI breakdown the referrer will see — skills matched, skills missing, and improvement tips — so you can decide whether to bid before paying anything.`,
  },
  {
    question: 'Are the referrers real employees?',
    answer:
      'Yes. Every referrer signs up and verifies their identity through LinkedIn. You can see their reputation, number of successful referrals, and average response time before you bid. There are no anonymous "we will forward your resume" services on Refrd.',
  },
] as const

export const metadata = {
  title: 'For Job Seekers — Refrd',
  description:
    'How Refrd works for job seekers: bid for referrals from verified employees, see your AI match score upfront, and get a full refund if you are not selected.',
}

export default function ForJobSeekersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={faqPageJsonLd([...FAQS])} />
      <Navbar />

      <section className="bg-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <span className="pill bg-brand-100 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> For job seekers
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl">
            Stop applying into the void.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-soft">
            Refrd puts you in front of verified employees at the companies you want.
            Bid for priority, see your AI match score before you pay, and get a
            full refund if you&apos;re not selected.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/jobs">
              <Button size="lg">
                Browse open roles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline">
                Create your account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-text">What Refrd gives you</h2>
          <p className="mt-2 text-sm text-text-soft">
            Three guarantees, baked into how the product works.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Benefit
            icon={<BadgeCheck className="h-6 w-6 text-primary" />}
            title="Verified employees only"
          >
            Every referrer signs up with LinkedIn — real identity, real LinkedIn
            profile, real employer. No anonymous &ldquo;we&apos;ll forward your resume&rdquo;
            services.
          </Benefit>
          <Benefit
            icon={<Sparkles className="h-6 w-6 text-primary" />}
            title="See your match before bidding"
          >
            Run up to {FREE_MATCH_CHECK_LIMIT} free Quick Match checks each
            month. The same AI breakdown the referrer will see — skills matched,
            skills missing, improvement tips. Skip bidding on bad-fit roles.
          </Benefit>
          <Benefit
            icon={<RefreshCw className="h-6 w-6 text-primary" />}
            title="Refund if not selected"
          >
            If the referrer declines, you&apos;re refunded immediately. If they
            don&apos;t respond within {APPLY_AUTO_REFUND_DAYS} days, the system
            refunds you automatically. Razorpay-secured throughout.
          </Benefit>
        </div>
      </section>

      <section className="bg-white/[0.03]">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-text">How it works</h2>
            <p className="mt-2 text-sm text-text-soft">
              Eight steps, ~5 minutes for the apply itself.
            </p>
          </div>
          <ol className="mt-10 space-y-5">
            <Step
              n={1}
              icon={<Linkedin className="h-4 w-4" />}
              title="Sign in with LinkedIn"
            >
              Confirms identity in one click. No password to remember, no
              account-farm spam.
            </Step>
            <Step
              n={2}
              icon={<FileSearch className="h-4 w-4" />}
              title="Browse jobs"
            >
              Filter by company, location, skills, or experience level. Each job
              shows the verified-employee referrer, current highest bid, and
              applicant count — you know exactly what you&apos;re bidding into.
            </Step>
            <Step
              n={3}
              icon={<Sparkles className="h-4 w-4" />}
              title="Run a free Quick Match (optional)"
            >
              Upload your resume; we run the same AI scoring the referrer will
              see. Decide whether to bid based on a real score, not a hunch.
              {' '}{FREE_MATCH_CHECK_LIMIT} free checks per month.
            </Step>
            <Step n={4} icon={<Trophy className="h-4 w-4" />} title="Place your bid">
              Pure auction — no brackets, no tiers. Higher bids are reviewed
              first. The job&apos;s minimum bid (if set) is shown upfront.
            </Step>
            <Step
              n={5}
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Pay via Razorpay"
            >
              Standard secured checkout. Funds are held — not yet released to
              the referrer.
            </Step>
            <Step
              n={6}
              icon={<BadgeCheck className="h-4 w-4" />}
              title="Watch your rank in real time"
            >
              Your dashboard shows your live rank versus other applicants and
              the full AI score breakdown the referrer sees too — no information
              asymmetry.
            </Step>
            <Step
              n={7}
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="If selected: referrer proves they referred you"
            >
              The referrer submits you on their company ATS (Greenhouse,
              Workday, etc.) and uploads the confirmation email. Once verified,
              you get an email — you&apos;ve been referred. Payout releases to
              them only after this step.
            </Step>
            <Step
              n={8}
              icon={<RefreshCw className="h-4 w-4" />}
              title="If not selected: refund"
            >
              Refund hits your card within 24 hours of decline.{' '}
              {APPLY_AUTO_REFUND_DAYS}-day timer auto-refunds you if the
              referrer doesn&apos;t act at all.
            </Step>
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-text">Why it works</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card">
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="mt-2 text-sm font-bold text-text">Pure auction</h3>
            <p className="mt-1 text-sm text-text-soft">
              Highest bids reviewed first. No opaque tiers, no &ldquo;premium&rdquo;
              fast-track that costs 10x more.
            </p>
          </div>
          <div className="card">
            <ShieldCheck className="h-5 w-5 text-success" />
            <h3 className="mt-2 text-sm font-bold text-text">Proof-of-referral</h3>
            <p className="mt-1 text-sm text-text-soft">
              Payouts only fire after the referrer uploads the company&apos;s
              confirmation email. AI verifies the screenshot before the wallet
              credits.
            </p>
          </div>
          <div className="card">
            <Sparkles className="h-5 w-5 text-warning" />
            <h3 className="mt-2 text-sm font-bold text-text">Full transparency</h3>
            <p className="mt-1 text-sm text-text-soft">
              The same AI score breakdown — overall, skills match, experience,
              education, cover note — is visible to both you and the referrer.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-bg-elev text-text border-y border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold">Ready to be reviewed first?</h2>
          <p className="mt-3 text-text-faint">
            Sign up takes 30 seconds. No credit card on signup.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/auth/signup">
              <Button size="lg">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-bg-card/10">
                Browse jobs first
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-text-faint">
            Are you a referrer instead?{' '}
            <Link href="/for-referrers" className="text-white underline">
              See the referrer guide →
            </Link>
          </p>
        </div>
      </section>

      {/* ─── FAQ — visible content backing the FAQPage JSON-LD ──── */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <h2 className="text-2xl font-extrabold text-text">
          Common questions
        </h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {FAQS.map((faq) => (
            <div key={faq.question} className="py-5">
              <h3 className="text-base font-semibold text-text">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-soft">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Benefit({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-brand-50">
        {icon}
      </div>
      <h3 className="mt-3 text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-text-soft">{children}</p>
    </div>
  )
}

function Step({
  n,
  icon,
  title,
  children,
}: {
  n: number
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
          {icon}
        </div>
        <span className="mt-1 text-xs font-bold text-text-faint">{n.toString().padStart(2, '0')}</span>
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-base font-semibold text-text">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-text-soft">{children}</p>
      </div>
    </li>
  )
}

