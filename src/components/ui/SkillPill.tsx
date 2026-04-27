import { cn } from '@/lib/utils'

interface Props {
  skill: string
  variant?: 'default' | 'matched' | 'missing'
  size?: 'sm' | 'md'
  className?: string
  onRemove?: () => void
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  matched: 'bg-green-50 text-success border border-green-200',
  missing: 'bg-red-50 text-error border border-red-200',
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
