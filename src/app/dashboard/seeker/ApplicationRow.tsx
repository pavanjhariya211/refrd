'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { MatchGradeBadge } from '@/components/ui/MatchGradeBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatINR } from '@/lib/utils'
import type { Application } from '@/types'

interface Props {
  app: Application
  onViewScore: () => void
}

export function ApplicationRow({ app, onViewScore }: Props) {
  const subscriptionId = useId()
  const [highest, setHighest] = useState(app.job?.current_highest_bid ?? 0)
  const [count, setCount] = useState(app.job?.applications_count ?? 1)
  const [rankAbove, setRankAbove] = useState(0)

  // Live updates for the parent job's bid stats so we can show rank shifts in real time.
  useEffect(() => {
    if (!app.job_id) return
    const supabase = createClient()
    let cancelled = false

    async function fetchRank() {
      const { data } = await supabase
        .from('applications')
        .select('bid_amount')
        .eq('job_id', app.job_id)
        .eq('payment_status', 'paid')
      if (cancelled) return
      const bids = (data ?? []).map((r) => r.bid_amount)
      setCount(bids.length)
      setRankAbove(bids.filter((b) => b > app.bid_amount).length)
    }
    fetchRank()

    const channel = supabase
      .channel(`apps:${app.job_id}:${subscriptionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `job_id=eq.${app.job_id}` },
        () => fetchRank()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'job_posts', filter: `id=eq.${app.job_id}` },
        (payload) => {
          const next = payload.new as { current_highest_bid: number; applications_count: number }
          setHighest(next.current_highest_bid ?? 0)
          setCount(next.applications_count ?? 0)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [app.job_id, app.bid_amount, subscriptionId])

  const myRank = rankAbove + 1
  const outranked = highest > app.bid_amount

  return (
    <tr
      className={
        'border-b border-slate-100 last:border-0 ' +
        (outranked && app.payment_status === 'paid' ? 'bg-amber-50/50' : '')
      }
    >
      <td className="px-4 py-3">
        <Link href={`/jobs/${app.job_id}`} className="font-semibold text-slate-900 hover:text-primary">
          {app.job?.title}
        </Link>
        <p className="text-xs text-slate-500">{app.job?.company_name}</p>
      </td>
      <td className="px-4 py-3 font-bold text-warning">{formatINR(app.bid_amount)}</td>
      <td className="px-4 py-3">
        {app.payment_status === 'refunded' ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <>
            <strong>#{myRank}</strong>
            <span className="text-xs text-slate-500"> of {count}</span>
            {outranked && (
              <p className="text-xs text-warning" title="A higher bid was placed">
                Top: {formatINR(highest)}
              </p>
            )}
          </>
        )}
      </td>
      <td className="px-4 py-3">
        {app.match_grade && app.match_score != null ? (
          <MatchGradeBadge grade={app.match_grade} score={app.match_score} size="sm" />
        ) : (
          <span className="text-xs text-slate-400">scoring…</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={app.status} />
        {app.proof && app.proof.status !== 'approved' && app.status !== 'referred' && (
          <p
            className={
              'mt-1 text-[11px] ' +
              (app.proof.status === 'rejected' ? 'text-error' : 'text-warning')
            }
          >
            {app.proof.status === 'needs_review'
              ? 'Referrer submitted proof — awaiting verification'
              : 'Proof rejected — referrer will retry'}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onViewScore}>
            View score
          </Button>
          <Link href={`/messages?application_id=${app.id}`}>
            <Button size="sm" variant="ghost">
              Message
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  )
}
