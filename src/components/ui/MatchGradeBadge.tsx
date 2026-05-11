import { cn } from '@/lib/utils'
import type { MatchGrade } from '@/types'

interface Props {
  grade: MatchGrade
  score?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

// Acid yellow ladder — strongest grades pop, weakest fade to muted.
const GRADE_META: Record<MatchGrade, { label: string; color: string }> = {
  A: { label: 'Excellent', color: '#E8FF47' },
  B: { label: 'Good', color: '#E8FF47' },
  C: { label: 'Partial', color: '#FAFAFA' },
  D: { label: 'Weak', color: '#888888' },
  F: { label: 'Poor', color: '#555555' },
}

const sizes = {
  sm: { circle: 'h-7 w-7 text-xs', text: 'text-xs' },
  md: { circle: 'h-9 w-9 text-sm', text: 'text-sm' },
  lg: { circle: 'h-12 w-12 text-base', text: 'text-base' },
}

export function MatchGradeBadge({ grade, score, size = 'md', showLabel, className }: Props) {
  const meta = GRADE_META[grade]
  const s = sizes[size]
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn('flex items-center justify-center border font-bold', s.circle)}
        style={{
          color: meta.color,
          borderColor: meta.color,
          background: 'transparent',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {grade}
      </span>
      {(typeof score === 'number' || showLabel) && (
        <span
          className={cn('font-semibold', s.text)}
          style={{ color: meta.color, fontFamily: 'var(--font-mono)' }}
        >
          {typeof score === 'number' ? `${score} · ${grade}` : meta.label}
        </span>
      )}
    </div>
  )
}

// Backwards-compat export for code that imports from this module.
export const MATCH_GRADE_META = GRADE_META
