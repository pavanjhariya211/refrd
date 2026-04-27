import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_META, type ApplicationStatus } from '@/types'

interface Props {
  status: ApplicationStatus
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'sm', className }: Props) {
  const meta = APPLICATION_STATUS_META[status]
  return (
    <span
      className={cn(
        'pill',
        size === 'md' && 'px-3 py-1 text-sm',
        className
      )}
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}
