import type { Metadata } from 'next'

// Metadata for the /jobs listing page. The page itself is a client
// component (filter state lives in the browser), so it cannot export
// metadata directly — a route layout is the idiomatic place for it.
// /jobs/[id] overrides this via its own generateMetadata.
export const metadata: Metadata = {
  title: 'Browse jobs — Bid for referrals from verified employees',
  description:
    'Browse open roles on Refrd. Bid for a referral from a verified employee, see your AI match score, and get reviewed first. Full refund if not selected.',
  alternates: {
    canonical: '/jobs',
  },
  openGraph: {
    title: 'Browse jobs — Refrd',
    description:
      'Bid for referrals from verified employees. Highest bids are reviewed first.',
    url: '/jobs',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
