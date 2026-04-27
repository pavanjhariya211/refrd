'use client'

import { useMemo } from 'react'
import { cn, formatINR } from '@/lib/utils'

interface Props {
  bidAmount: number
  allBids: number[]
  className?: string
}

export function BidRankIndicator({ bidAmount, allBids, className }: Props) {
  const { rank, total, nextHigher } = useMemo(() => {
    const sorted = [...allBids, bidAmount].sort((a, b) => b - a)
    const idx = sorted.indexOf(bidAmount)
    const higher = sorted.slice(0, idx)
    const next = higher.length > 0 ? higher[higher.length - 1] : null
    return { rank: idx + 1, total: sorted.length, nextHigher: next }
  }, [bidAmount, allBids])

  if (bidAmount <= 0) {
    return (
      <div className={cn('text-xs text-slate-500', className)}>
        Enter a bid to see your projected rank
      </div>
    )
  }

  const isFirst = rank === 1
  const pct = total > 0 ? Math.max(4, ((total - rank + 1) / total) * 100) : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-slate-900">
          You'd be ranked <span className="text-primary">#{rank}</span>{' '}
          <span className="text-slate-500">of {total}</span>
        </span>
        {isFirst && <span className="text-xs font-semibold text-success">🏆 Top bid</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all', isFirst ? 'bg-success' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!isFirst && nextHigher && (
        <p className="text-xs text-slate-500">
          Bid <strong className="text-slate-900">{formatINR(nextHigher + 100)}</strong> to move
          to #{rank - 1}
        </p>
      )}
    </div>
  )
}
