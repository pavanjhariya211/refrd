'use client'

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MatchGradeBadge } from '@/components/ui/MatchGradeBadge'
import { ScorePanel, ScorePanelSkeleton } from '@/components/ui/ScorePanel'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatRelativeTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import type { Application } from '@/types'
import { ApplicationRow } from './ApplicationRow'

interface Props {
  applications: Application[]
}

export function SeekerDashboardClient({ applications }: Props) {
  const [openScoreFor, setOpenScoreFor] = useState<Application | null>(null)
  const router = useRouter()
  const { user } = useUser()
  const subId = useId()

  // Realtime: refresh the page when this seeker's applications or
  // referral_proofs change (e.g. admin approves a proof, OCR auto-approves
  // a fresh upload, payout completes). router.refresh() re-runs the parent
  // server component and reloads `applications` in place — no manual state
  // sync, no flicker.
  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    const ch = supabase
      .channel(`seeker:${user.id}:${subId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `applicant_id=eq.${user.id}`,
        },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_proofs',
        },
        (payload) => {
          // referral_proofs has no applicant_id column to filter on; only
          // refresh when the changed row's application belongs to this user.
          // We don't know that without another query — cheapest path is
          // refresh, since payload-driven false positives are rare and
          // router.refresh() is light.
          if (payload.new || payload.old) router.refresh()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [user?.id, subId, router])

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
        <h2 className="mb-3 text-lg font-bold text-text">Active applications</h2>
        {applications.length === 0 ? (
          <div className="card text-center text-sm text-text-soft">
            You haven&apos;t applied yet.{' '}
            <Link href="/jobs" className="font-semibold text-primary">Browse jobs →</Link>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-white/[0.03] text-left text-xs font-semibold uppercase text-text-faint">
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
          <h2 className="mb-3 text-lg font-bold text-text">Refunded bids</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {refunded.map((r) => (
              <div key={r.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold">{r.job?.title}</p>
                  <p className="text-xs text-text-faint">
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
              <p className="mb-3 text-sm text-text-faint">
                Scoring in progress — your match breakdown will appear here in a few seconds.
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
      <p className="text-xs uppercase text-text-faint">{label}</p>
      <p
        className={
          'mt-1 text-2xl font-extrabold ' + (highlight ? 'text-success' : 'text-text')
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
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-bg-card shadow-card-hover">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold text-text">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/[0.06]">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
