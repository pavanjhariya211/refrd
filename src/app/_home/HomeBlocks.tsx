import Link from 'next/link'
import { formatINR } from '@/lib/utils'
import type { JobPost } from '@/types'

// Renders the shared SVG gradient that the AI-score ring stroke
// references via stroke="url(#scoreGrad)". Placed once near the top of
// the page so the def exists before any consumer paints.
export function ScoreGradientDef() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Two-letter monogram from the company name for the auction tile logo.
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Each tile cycles through a different gradient so a grid of them feels
// alive rather than uniform. Mirrors the reference's nth-child styling.
const LOGO_GRADIENTS = [
  'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
  'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
  'linear-gradient(135deg, #6366f1 0%, #7e22ce 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
]

export function JobAuctionCard({ job, index }: { job: JobPost; index: number }) {
  const hasBid = job.current_highest_bid > 0
  const meta = [job.company_name, job.location, job.location_type, job.experience_level]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group relative grid grid-cols-[52px_1fr_auto] items-start gap-[18px] overflow-hidden rounded-card border border-border p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background:
          'linear-gradient(180deg, rgba(29, 22, 53, 0.7) 0%, rgba(22, 16, 41, 0.5) 100%)',
      }}
    >
      {/* Violet edge-glow on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          padding: '1px',
          background:
            'linear-gradient(135deg, transparent, rgba(168, 85, 247, 0.4), transparent)',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div
        className="grid h-[52px] w-[52px] place-items-center rounded-[12px] text-lg font-bold text-white"
        style={{
          background: LOGO_GRADIENTS[index % LOGO_GRADIENTS.length],
          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
        }}
      >
        {initials(job.company_name)}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[17px] font-semibold tracking-[-0.015em]">
          {job.title}
        </div>
        <div className="mt-1 truncate text-[13px] text-text-soft">{meta}</div>
        {job.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-pill border border-border bg-white/5 px-2.5 py-0.5 text-[11px] text-text-soft"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-right">
        <div className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
          {hasBid ? 'Highest' : 'From'}
        </div>
        <div className="mt-1 font-mono text-[22px] font-bold tracking-[-0.02em] accent-italic">
          {formatINR(hasBid ? job.current_highest_bid : job.min_bid)}
        </div>
        {hasBid ? (
          <div className="mt-1 text-[11px] text-text-faint">
            From {formatINR(job.min_bid)}
          </div>
        ) : (
          <div className="live-pulse mt-1.5 justify-end">Live</div>
        )}
      </div>
    </Link>
  )
}
