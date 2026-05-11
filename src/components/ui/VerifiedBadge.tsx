import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VerificationStatus } from '@/types'

interface Props {
  status: VerificationStatus
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function VerifiedBadge({ status, size = 'sm', showLabel, className }: Props) {
  if (status !== 'verified') return null
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill bg-blue-50 px-2 py-0.5 text-xs font-semibold text-primary',
        className
      )}
      title="Verified employee"
    >
      <BadgeCheck className={iconSize} />
      {showLabel && <span>Verified</span>}
    </span>
  )
}
