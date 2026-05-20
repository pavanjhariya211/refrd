import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Wallet,
  BadgeCheck,
  Linkedin,
  Briefcase,
  Users,
  Trophy,
  FileUp,
  CheckCircle2,
} from 'lucide-react'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/JsonLd'
import { faqPageJsonLd } from '@/lib/jsonld'
import { PLATFORM_FEE_RATE, PLATFORM_FEE_MIN } from '@/lib/scoring'

export const metadata = {
  title: 'For Referrers — Refrd',
  description:
    'How Refrd works for referrers: post a job at your company, review pre-screened bid-sorted applicants, refer the best fit, and get auto-paid on confirmation.',
}

const PLATFORM_FEE_PCT = Math.round(PLATFORM_FEE_RATE * 100)

const FAQS = [
  {
    question: 'How do I earn money as a referrer on Refrd?',
    answer:
      'You post a job at your company. Pre-screened candidates bid for your time. You review the AI match scores, refer the best fit on your company ATS, and upload a screenshot of the confirmation email. Once verified, the payout lands in your Refrd wallet automatically.',
  },
  {
    question: 'How much of each bid do I keep?',
    answer:
      `You keep ${100 - PLATFORM_FEE_PCT}% of every bid. Refrd takes a ${PLATFORM_FEE_PCT}% platform fee (minimum ₹${PLATFORM_FEE_MIN}). There are no tiers and no subscription — the fee is flat.`,
  },
  {
    question: 'When do I get paid?',
    answer:
      'After you submit the candidate on your company ATS and upload the confirmation-email screenshot, an AI check verifies it. On approval the payout credits your wallet immediately. If the AI cannot decide, an admin reviews it within 24 hours.',
  },
  {
    question: 'What proof do I need to submit?',
    answer:
      'A screenshot of the referral confirmation email from your company ATS — Greenhouse, Lever, Workday, Workable, Ashby, or similar. The screenshot should show the candidate name and company so the AI check can match it to the application.',
  },
  {
    question: 'Do I need to be verified to post jobs?',
    answer:
      'Yes. Every referrer verifies their identity through LinkedIn at signup. That is what powers the "Verified employee" badge job seekers see on your posts, and it is what lets them trust the referral is real.',
  },
] as const

export default function ForReferrersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={faqPageJsonLd([...FAQS])} />
      <Navbar />

      <section className="bg-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <span className="pill bg-brand-100 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> For referrers
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl">
            Earn for the referrals you&apos;d give anyway.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-soft">
            Post a role at your company. Pre-screened candidates bid for your
            time, sorted by who&apos;s most serious. Submit a referral on your
            ATS, upload the confirmation, and {100 - PLATFORM_FEE_PCT}% of the
            bid lands in your wallet automatically.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/post-job">
              <Button size="lg">
                Post your first job <ArrowRight className="h-4 w-4" />
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
            Three things you don&apos;t get on any other referral channel.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Benefit
            icon={<Sparkles className="h-6 w-6 text-primary" />}
            title="AI-pre-screened candidates"
          >
            Every applicant comes with a match score, breakdown, and ranked
            skills. Skip the resume pile — open the kanban, see who&apos;s a
            real fit, refer them in two clicks.
          </Benefit>
          <Benefit
            icon={<Trophy className="h-6 w-6 text-primary" />}
            title="Bid-sorted by priority"
          >
            Highest bids show first. Your time goes to the candidates who put
            real money behind their interest — not 200 random submissions to a
            black-hole job board.
          </Benefit>
          <Benefit
            icon={<Wallet className="h-6 w-6 text-primary" />}
            title="Auto-payout on confirmation"
          >
            Submit the candidate on your ATS, upload the screenshot, OCR
            verifies, wallet credits. {100 - PLATFORM_FEE_PCT}% of every bid
            (₹{PLATFORM_FEE_MIN} platform fee minimum). Withdraw to your bank
            anytime.
          </Benefit>
        </div>
      </section>

      <section className="bg-white/[0.03]">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-text">How it works</h2>
            <p className="mt-2 text-sm text-text-soft">
              Nine steps end-to-end. Steps 1–2 are once. Steps 3–9 repeat per
              referral.
            </p>
          </div>
          <ol className="mt-10 space-y-5">
            <Step
              n={1}
              icon={<Linkedin className="h-4 w-4" />}
              title="Sign in with LinkedIn"
            >
              Auto-verifies you as a real LinkedIn-confirmed person — that&apos;s
              what powers the &ldquo;Verified employee&rdquo; badge applicants
              see on your jobs.
            </Step>
            <Step
              n={2}
              icon={<Briefcase className="h-4 w-4" />}
              title="Post a job"
            >
              Title, company, skills, location, optional minimum bid. Higher
              minimum bids mean fewer but more-serious applicants. The first
              job sets your profile&apos;s company so the verified-employee
              badge fires correctly.
            </Step>
            <Step
              n={3}
              icon={<Users className="h-4 w-4" />}
              title="Applicants come in, sorted by bid"
            >
              Your kanban board shows everyone who paid to bid, sorted highest
              first by default. Toggle to AI score or date if you prefer.
            </Step>
            <Step
              n={4}
              icon={<Sparkles className="h-4 w-4" />}
              title="Open the AI score and resume"
            >
              Per applicant: overall match grade, skills matched vs missing,
              experience score, cover note score, signed-URL resume preview.
              The breakdown is the same one the applicant sees.
            </Step>
            <Step
              n={5}
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="Click Refer on the candidate you&apos;d vouch for"
            >
              Or click Decline if no one is a fit — Decline triggers an
              automatic Razorpay refund to the seeker, no friction.
            </Step>
            <Step
              n={6}
              icon={<Briefcase className="h-4 w-4" />}
              title="Submit them on your company ATS"
            >
              Greenhouse, Lever, Workday, Workable, Ashby, custom — whatever
              your company uses. Your normal internal referral process,
              unchanged.
            </Step>
            <Step
              n={7}
              icon={<FileUp className="h-4 w-4" />}
              title="Upload a screenshot of the confirmation email"
            >
              Most ATSes send a &ldquo;Thank you for your referral&rdquo; email.
              Screenshot it, drop it into the Refer modal, hit submit. Takes
              ~10 seconds.
            </Step>
            <Step
              n={8}
              icon={<ShieldCheck className="h-4 w-4" />}
              title="OCR verifies and credits your wallet"
            >
              We OCR the screenshot for the candidate name and company match.
              On approve: instant payout (
              {100 - PLATFORM_FEE_PCT}% of the bid, ₹{PLATFORM_FEE_MIN}{' '}
              platform fee minimum). If anything looks off, an admin reviews
              within 24 hours.
            </Step>
            <Step
              n={9}
              icon={<Wallet className="h-4 w-4" />}
              title="Withdraw to your bank"
            >
              The wallet page shows balance, total earned, transaction history,
              and a 30-day earnings chart. Withdraw anytime when you have ≥
              ₹500.
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
            <BadgeCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-2 text-sm font-bold text-text">No spam</h3>
            <p className="mt-1 text-sm text-text-soft">
              Applicants pay to bid. The price filter beats any keyword filter
              — 10 paid serious applicants beat 200 free random ones.
            </p>
          </div>
          <div className="card">
            <Sparkles className="h-5 w-5 text-warning" />
            <h3 className="mt-2 text-sm font-bold text-text">
              Pre-screening done
            </h3>
            <p className="mt-1 text-sm text-text-soft">
              Every applicant comes with an AI-generated breakdown. You don&apos;t
              have to read 30 resumes — you read the top 3 by score.
            </p>
          </div>
          <div className="card">
            <Wallet className="h-5 w-5 text-success" />
            <h3 className="mt-2 text-sm font-bold text-text">
              Aligned incentives
            </h3>
            <p className="mt-1 text-sm text-text-soft">
              Payout only releases on proof of actual referral. You can&apos;t
              get paid without doing the work; the seeker can&apos;t lose
              money to someone who didn&apos;t refer them. Both sides win.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-bg-elev text-text border-y border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold">Ready to get paid for referrals?</h2>
          <p className="mt-3 text-text-faint">
            Sign up takes 30 seconds. The first job pays for itself.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/post-job">
              <Button size="lg">
                Post a job <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-bg-card/10">
                Sign up first
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-text-faint">
            Looking for a referral instead?{' '}
            <Link href="/for-job-seekers" className="text-white underline">
              See the seeker guide →
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
