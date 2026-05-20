'use client'

import { TrendingUp, Users, Trophy } from 'lucide-react'
import { cn, formatINR } from '@/lib/utils'

interface Props {
  minBid: number
  currentHighest: number
  applicantCount: number
  userBid?: number
  userRank?: number
  className?: string
  compact?: boolean
}

export function BidDisplay({
  minBid,
  currentHighest,
  applicantCount,
  userBid,
  userRank,
  className,
  compact,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-bg-card p-4 text-sm',
        compact && 'p-3 text-xs',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-text-soft">
          <Users className="h-4 w-4" />
          <span>
            <strong className="text-text">{applicantCount}</strong>{' '}
            {applicantCount === 1 ? 'applicant' : 'applicants'}
          </span>
        </div>
        {currentHighest > 0 && (
          <div className="flex items-center gap-1.5 text-warning">
            <Trophy className="h-4 w-4" />
            <span>
              Highest:&nbsp;
              <strong className="font-bold">{formatINR(currentHighest)}</strong>
            </span>
          </div>
        )}
      </div>
      {minBid > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-text-faint">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Minimum bid: {formatINR(minBid)}</span>
        </div>
      )}
      {typeof userBid === 'number' && userBid > 0 && typeof userRank === 'number' && (
        <div className="mt-2 rounded-input bg-violet/10 p-2 text-violet-bright">
          Your bid of <strong>{formatINR(userBid)}</strong> — ranked{' '}
          <strong>#{userRank}</strong>
          {userRank === 1 && <span className="ml-1">🏆</span>}
        </div>
      )}
    </div>
  )
}
