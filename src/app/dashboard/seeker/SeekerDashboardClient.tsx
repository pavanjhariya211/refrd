'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MatchGradeBadge } from '@/components/ui/MatchGradeBadge'
import { ScorePanel, ScorePanelSkeleton } from '@/components/ui/ScorePanel'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatRelativeTime } from '@/lib/utils'
import type { Application } from '@/types'
import { ApplicationRow } from './ApplicationRow'

interface Props {
  applications: Application[]
}

export function SeekerDashboardClient({ applications }: Props) {
  const [openScoreFor, setOpenScoreFor] = useState<Application | null>(null)

  const stats = {
    total: applications.length,
    inReview: applications.filter((a) =>
      ['applied', 'reviewing', 'accepted'].includes(a.status)
    ).length,
    referred: applications.filter((a) =>
      ['referred', 'interview', 'offer'].includes(a.status)
    ).length,
    totalBid: applications
      .filter((a) => a.payment_status !== 'refunded')
      .reduce((acc, a) => acc + a.bid_amount, 0),
  }

  const refunded = applications.filter((a) => a.payment_status === 'refunded')

  return (
    <>
      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Applications sent" value={stats.total.toString()} />
        <Stat label="Bids in review" value={stats.inReview.toString()} />
        <Stat label="Referrals received" value={stats.referred.toString()} highlight />
        <Stat label="Total bid amount" value={formatINR(stats.totalBid)} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Active applications</h2>
        {applications.length === 0 ? (
          <div className="card text-center text-sm text-slate-600">
            You haven&apos;t applied yet.{' '}
            <Link href="/jobs" className="font-semibold text-primary">Browse jobs →</Link>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Bid</th>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">AI Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    app={app}
                    onViewScore={() => setOpenScoreFor(app)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {refunded.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Refunded bids</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {refunded.map((r) => (
              <div key={r.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold">{r.job?.title}</p>
                  <p className="text-xs text-slate-500">
                    Refunded {formatRelativeTime(r.updated_at)}
                  </p>
                </div>
                <span className="text-base font-bold text-success">{formatINR(r.bid_amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {openScoreFor && (
        <SidePanel
          onClose={() => setOpenScoreFor(null)}
          title={openScoreFor.job?.title ?? 'AI score'}
        >
          {openScoreFor.match ? (
            <ScorePanel score={openScoreFor.match} showImprovementTips />
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                Scoring in progress — results appear here once Claude finishes.
              </p>
              <ScorePanelSkeleton />
            </>
          )}
        </SidePanel>
      )}
    </>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p
        className={
          'mt-1 text-2xl font-extrabold ' + (highlight ? 'text-success' : 'text-slate-900')
        }
      >
        {value}
      </p>
    </div>
  )
}

function SidePanel({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/40">
      <button className="flex-1" aria-label="Close" onClick={onClose} />
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-card-hover">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
