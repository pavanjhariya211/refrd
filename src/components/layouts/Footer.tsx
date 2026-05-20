import Link from 'next/link'
import { Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12 grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="Refrd home">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-[15px] font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  boxShadow: '0 0 24px rgba(168, 85, 247, 0.4)',
                }}
              >
                R
              </span>
              <span className="text-lg font-semibold tracking-tight text-text">
                Refrd
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-soft">
              A safer way to get referred. Pay only when you actually get
              referred — every rupee back if you don&apos;t.
            </p>
            <a
              href="https://www.linkedin.com/company/refrd-ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-btn border border-border-hi bg-white/[0.02] px-3 py-2 text-sm font-medium text-text-soft transition-colors hover:border-violet/40 hover:text-text"
            >
              <Linkedin className="h-4 w-4" />
              Follow on LinkedIn
            </a>
          </div>

          <FooterColumn
            heading="Job seekers"
            links={[
              { href: '/for-job-seekers', label: 'How it works' },
              { href: '/jobs', label: 'Browse roles' },
              { href: '/dashboard/seeker', label: 'My applications' },
              { href: '/messages', label: 'Messages' },
            ]}
          />
          <FooterColumn
            heading="Referrers"
            links={[
              { href: '/for-referrers', label: 'How you get paid' },
              { href: '/post-job', label: 'List a role' },
              { href: '/verify', label: 'Get verified' },
              { href: '/dashboard/referrer/wallet', label: 'Wallet' },
            ]}
          />
          <FooterColumn
            heading="Trust & safety"
            links={[
              { href: '/blogs', label: 'Blog' },
              { href: '/for-job-seekers', label: 'Refund policy' },
              { href: '/for-job-seekers', label: 'How money is protected' },
              { href: '/for-referrers', label: 'Verification' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-xs text-text-faint">
          <span>© {new Date().getFullYear()} Refrd. All rights reserved.</span>
          <span>Made in India · Payments protected by Razorpay</span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h4 className="mb-5 font-mono text-[11px] font-medium uppercase tracking-widest text-text-faint">
        {heading}
      </h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-text-soft transition-colors hover:text-text"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
