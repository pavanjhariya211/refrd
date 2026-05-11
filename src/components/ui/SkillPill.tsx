import { cn } from '@/lib/utils'

interface Props {
  skill: string
  variant?: 'default' | 'matched' | 'missing'
  size?: 'sm' | 'md'
  className?: string
  onRemove?: () => void
}

const variants: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-chip border-line2 text-muted',
  matched: 'bg-chip border-accent/40 text-accent',
  missing: 'bg-chip border-error/40 text-error',
}

export function SkillPill({ skill, variant = 'default', size = 'sm', className, onRemove }: Props) {
  return (
    <span
      className={cn(
        'pill',
        variants[variant],
        size === 'md' && 'px-3 py-1 text-[11px]',
        className
      )}
    >
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-current opacity-60 hover:opacity-100"
          aria-label={`Remove ${skill}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
