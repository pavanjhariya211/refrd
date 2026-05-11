import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center" aria-label="Refrd home">
              <Image
                src="/logo.png"
                alt="Refrd.ai"
                width={140}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              Get referred by verified employees. Bid, get reviewed first,
              get refunded if not selected.
            </p>
          </div>

          <FooterCol title="Job Seekers">
            <FooterLink href="/for-job-seekers">How it works</FooterLink>
            <FooterLink href="/jobs">Browse jobs</FooterLink>
            <FooterLink href="/dashboard/seeker">My applications</FooterLink>
            <FooterLink href="/messages">Messages</FooterLink>
          </FooterCol>

          <FooterCol title="Referrers">
            <FooterLink href="/for-referrers">How it works</FooterLink>
            <FooterLink href="/post-job">Post a job</FooterLink>
            <FooterLink href="/verify">Get verified</FooterLink>
            <FooterLink href="/dashboard/referrer/wallet">Wallet</FooterLink>
          </FooterCol>

          <FooterCol title="Trust">
            <li className="text-[13px] text-muted">Full refund if not selected</li>
            <li className="text-[13px] text-muted">Razorpay-secured payments</li>
            <li className="text-[13px] text-muted">Full AI score transparency</li>
          </FooterCol>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="text-[11px] uppercase tracking-widest text-faint"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            © {new Date().getFullYear()} Refrd.ai · All rights reserved
          </p>
          <p
            className="text-[11px] uppercase tracking-widest text-faint"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Built for serious referrals
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4
        className="mb-4 text-[11px] uppercase tracking-widest text-paper"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {title}
      </h4>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[13px] text-muted hover:text-accent transition-colors">
        {children}
      </Link>
    </li>
  )
}
