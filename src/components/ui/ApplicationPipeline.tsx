import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'

interface Props {
  status: ApplicationStatus
  className?: string
}

const STAGES: { key: ApplicationStatus; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'referred', label: 'Referred' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
]

const STAGE_ORDER: Record<ApplicationStatus, number> = {
  applied: 0,
  reviewing: 1,
  accepted: 1,
  referred: 2,
  interview: 3,
  offer: 4,
  rejected: -1,
}

export function ApplicationPipeline({ status, className }: Props) {
  const currentIdx = STAGE_ORDER[status]
  const isRejected = status === 'rejected'
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STAGES.map((stage, i) => {
        const done = !isRejected && i <= currentIdx
        const current = !isRejected && i === currentIdx
        return (
          <div key={stage.key} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                done && !current && 'bg-success text-white',
                current && 'bg-primary text-white ring-4 ring-primary/20',
                !done && 'bg-slate-100 text-slate-400'
              )}
            >
              {done && !current ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 rounded',
                  i < currentIdx ? 'bg-success' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
