import Link from 'next/link'
import { Briefcase, MapPin, Users, Trophy, Clock } from 'lucide-react'
import { cn, formatINR, formatRelativeTime } from '@/lib/utils'
import type { JobPost } from '@/types'
import { CompanyAvatar } from './CompanyAvatar'
import { SkillPill } from './SkillPill'
import { VerifiedBadge } from './VerifiedBadge'

interface Props {
  job: JobPost
  className?: string
}

export function JobCard({ job, className }: Props) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className={cn('card card-hover block', className)}
    >
      <div className="flex items-start gap-3">
        <CompanyAvatar name={job.company_name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-text">{job.title}</h3>
              <div className="flex items-center gap-1.5 text-sm text-text-soft">
                <span className="truncate">{job.company_name}</span>
                <VerifiedBadge status={job.referrer?.verification_status ?? 'unverified'} />
              </div>
            </div>
            {job.referral_bonus && (
              <span className="pill bg-amber-500/10 text-[#fcd34d]">{job.referral_bonus}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-faint">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location} · {job.location_type}
              </span>
            )}
            {job.experience_level && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.experience_level}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeTime(job.created_at)}
            </span>
          </div>

          {job.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.slice(0, 5).map((s) => (
                <SkillPill key={s} skill={s} />
              ))}
              {job.skills.length > 5 && (
                <span className="text-xs text-text-faint">+{job.skills.length - 5} more</span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs">
            <span className="inline-flex items-center gap-1 text-text-soft">
              <Users className="h-3.5 w-3.5" />
              <strong className="text-text">{job.applications_count}</strong> applicants
            </span>
            {job.min_bid > 0 && (
              <span className="pill bg-amber-500/10 text-[#fcd34d]">
                Bids from {formatINR(job.min_bid)}
              </span>
            )}
            {job.current_highest_bid > 0 && (
              <span className="inline-flex items-center gap-1 text-warning">
                <Trophy className="h-3.5 w-3.5" />
                Highest: <strong>{formatINR(job.current_highest_bid)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
