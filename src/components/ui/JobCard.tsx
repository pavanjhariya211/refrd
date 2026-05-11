import Link from 'next/link'
import type { JobPost, ExperienceLevel } from '@/types'
import { cn, formatINR, formatRelativeTime } from '@/lib/utils'

interface Props {
  job: JobPost
  className?: string
}

// Surface-friendly labels for the experience enum.
const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  fresher: 'Fresher',
  '1-3yrs': '1–3 yrs',
  '3-7yrs': '3–7 yrs',
  '7plus': '7+ yrs',
}

const WORK_MODE_LABEL: Record<JobPost['location_type'], string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

export function JobCard({ job, className }: Props) {
  const expLabel = job.experience_level ? EXPERIENCE_LABEL[job.experience_level] : null
  const modeLabel = WORK_MODE_LABEL[job.location_type] ?? null
  return (
    <Link
      href={`/jobs/${job.id}`}
      className={cn(
        'group block bg-card border border-line transition-colors duration-150 hover:border-accent',
        className
      )}
    >
      {/* TOP — title, meta, skills */}
      <div className="p-5">
        <h3
          className="text-[18px] font-bold leading-tight text-paper line-clamp-2"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          {job.title}
        </h3>

        <p
          className="mt-2 text-[12px] text-muted"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span className="text-paper">{job.company_name}</span>
          {job.location ? <> · {job.location}</> : null}
          {modeLabel ? <> · {modeLabel}</> : null}
        </p>

        <p
          className="mt-1 text-[11px] text-faint"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {formatRelativeTime(job.created_at)}
          {expLabel ? <> · {expLabel}</> : null}
        </p>

        {job.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="pill bg-chip border-line2 text-muted"
              >
                {s}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span
                className="text-[10px] uppercase tracking-widest text-faint self-center"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM — MIN BID / TOP BID / applicants */}
      <div className="grid grid-cols-3 gap-3 border-t border-line px-5 py-3.5 items-center">
        <div>
          <p
            className="text-[10px] uppercase tracking-widest text-muted"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Min bid
          </p>
          <p
            className="text-[15px] text-paper"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {job.min_bid > 0 ? formatINR(job.min_bid) : '—'}
          </p>
        </div>
        <div>
          <p
            className="text-[10px] uppercase tracking-widest text-muted"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Top bid
          </p>
          <p
            className="text-[15px] font-bold text-accent"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {job.current_highest_bid > 0 ? formatINR(job.current_highest_bid) : '—'}
          </p>
        </div>
        <div className="text-right">
          {job.applications_count === 0 ? (
            <p
              className="text-[12px] text-accent group-hover:underline"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Be first →
            </p>
          ) : (
            <p
              className="text-[12px] text-muted"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {job.applications_count} applicants
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
