import { Lightbulb, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { cn, getColorForScore } from '@/lib/utils'
import { MATCH_GRADE_META, type MatchScore } from '@/types'
import { MatchGradeBadge } from './MatchGradeBadge'

interface Props {
  score: MatchScore
  showImprovementTips?: boolean
  className?: string
}

const DIMENSION_LABELS: Array<{ key: keyof MatchScore; label: string; weight: number }> = [
  { key: 'skills_score', label: 'Skills Match', weight: 30 },
  { key: 'experience_score', label: 'Experience', weight: 20 },
  { key: 'relevance_score', label: 'Role Relevance', weight: 20 },
  { key: 'education_score', label: 'Education', weight: 10 },
  { key: 'cover_note_score', label: 'Cover Note', weight: 10 },
  { key: 'keyword_score', label: 'Keywords', weight: 10 },
]

export function ScorePanel({ score, showImprovementTips, className }: Props) {
  const meta = MATCH_GRADE_META[score.grade]
  return (
    <div className={cn('space-y-6', className)}>
      <div
        className="flex flex-col gap-3 rounded-card border p-5 sm:flex-row sm:items-start sm:gap-5"
        style={{ background: meta.bg, borderColor: `${meta.color}33` }}
      >
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-extrabold"
          style={{ background: 'white', color: meta.color, border: `2px solid ${meta.color}` }}
        >
          {score.grade}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold" style={{ color: meta.color }}>
              {score.overall_score}
            </span>
            <span className="text-sm text-slate-500">/ 100</span>
            <span className="text-sm font-semibold" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <p className="mt-2 text-sm italic leading-relaxed text-slate-700">
            <Sparkles className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
            {score.ai_summary}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Score Breakdown
        </h4>
        {DIMENSION_LABELS.map(({ key, label, weight }) => {
          const value = (score[key] as number) ?? 0
          const color = getColorForScore(value)
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-sm text-slate-600">
                {label}
                <span className="ml-1 text-xs text-slate-400">{weight}%</span>
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${value}%`, background: color }}
                />
              </div>
              <div className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                {value}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Matched Skills
          </h4>
          {score.matched_skills.length === 0 ? (
            <p className="text-xs text-slate-500">None detected</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {score.matched_skills.map((s) => (
                <span
                  key={s}
                  className="pill bg-green-50 text-success"
                  style={{ border: '1px solid #BBF7D0' }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-error">
            <XCircle className="h-4 w-4" /> Missing Skills
          </h4>
          {score.missing_skills.length === 0 ? (
            <p className="text-xs text-slate-500">None — strong match</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {score.missing_skills.map((s) => (
                <span
                  key={s}
                  className="pill bg-red-50 text-error"
                  style={{ border: '1px solid #FECACA' }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showImprovementTips && score.improvement_tips?.length > 0 && (
        <div
          className="rounded-card border p-4"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
        >
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warning">
            <Lightbulb className="h-4 w-4" /> Improvement Tips
          </h4>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {score.improvement_tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-warning">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Scored by Claude · {new Date(score.scored_at).toLocaleString()}
      </p>
    </div>
  )
}

export function ScorePanelSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 rounded-card bg-slate-100" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-slate-100" />
        ))}
      </div>
      <div className="h-24 rounded-card bg-slate-100" />
    </div>
  )
}
