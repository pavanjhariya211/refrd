import Link from 'next/link'
import Image from 'next/image'
import { Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center" aria-label="Refrd home">
              <Image
                src="/logo.png"
                alt="Refrd.ai"
                width={140}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-3 text-sm text-slate-600">
              Get referred by verified employees. Bid, get reviewed first, get refunded if not selected.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Job Seekers</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/for-job-seekers" className="hover:text-primary">How it works</Link></li>
              <li><Link href="/jobs" className="hover:text-primary">Browse jobs</Link></li>
              <li><Link href="/dashboard/seeker" className="hover:text-primary">My applications</Link></li>
              <li><Link href="/messages" className="hover:text-primary">Messages</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Referrers</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/for-referrers" className="hover:text-primary">How it works</Link></li>
              <li><Link href="/post-job" className="hover:text-primary">Post a job</Link></li>
              <li><Link href="/verify" className="hover:text-primary">Get verified</Link></li>
              <li><Link href="/dashboard/referrer/wallet" className="hover:text-primary">Wallet</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Trust</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Full refund if not selected</li>
              <li>Razorpay-secured payments</li>
              <li>Full AI score transparency</li>
            </ul>
            <a
              href="https://www.linkedin.com/company/refrd-ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-btn border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#0A66C2] hover:text-[#0A66C2]"
            >
              <Linkedin className="h-4 w-4" />
              Follow on LinkedIn
            </a>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} Refrd. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
