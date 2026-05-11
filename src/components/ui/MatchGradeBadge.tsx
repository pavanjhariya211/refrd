import { cn } from '@/lib/utils'
import { MATCH_GRADE_META, type MatchGrade } from '@/types'

interface Props {
  grade: MatchGrade
  score?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizes = {
  sm: { circle: 'h-7 w-7 text-xs', text: 'text-xs' },
  md: { circle: 'h-9 w-9 text-sm', text: 'text-sm' },
  lg: { circle: 'h-12 w-12 text-base', text: 'text-base' },
}

export function MatchGradeBadge({ grade, score, size = 'md', showLabel, className }: Props) {
  const meta = MATCH_GRADE_META[grade]
  const s = sizes[size]
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn('flex items-center justify-center rounded-full font-bold', s.circle)}
        style={{ background: meta.bg, color: meta.color }}
      >
        {grade}
      </span>
      {(typeof score === 'number' || showLabel) && (
        <span className={cn('font-semibold', s.text)} style={{ color: meta.color }}>
          {typeof score === 'number' ? `${score} · ${grade}` : meta.label}
        </span>
      )}
    </div>
  )
}
