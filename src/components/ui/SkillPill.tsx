import { cn } from '@/lib/utils'

interface Props {
  skill: string
  variant?: 'default' | 'matched' | 'missing'
  size?: 'sm' | 'md'
  className?: string
  onRemove?: () => void
}

const variants = {
  default: 'bg-white/[0.06] text-text-soft border border-border',
  matched: 'bg-success/10 text-[#6ee7b7] border border-success/25',
  missing: 'bg-error/10 text-[#fca5a5] border border-error/25',
}

export function SkillPill({ skill, variant = 'default', size = 'sm', className, onRemove }: Props) {
  return (
    <span
      className={cn(
        'pill',
        variants[variant],
        size === 'md' && 'text-sm px-3 py-1',
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
