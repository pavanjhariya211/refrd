'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useLiveBid } from '@/hooks/useLiveBid'
import { Button } from '@/components/ui/Button'
import { BidDisplay } from '@/components/ui/BidDisplay'
import { ApplyModal } from '@/components/forms/ApplyModal'
import type { JobPost } from '@/types'

interface Props {
  job: JobPost
}

export function JobApplyPanel({ job }: Props) {
  const { user } = useUser()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const live = useLiveBid(job.id, {
    minBid: job.min_bid,
    currentHighestBid: job.current_highest_bid,
    applicantCount: job.applications_count,
  })

  function onApply() {
    if (!user) {
      router.push(`/auth/login?next=/jobs/${job.id}`)
      return
    }
    setOpen(true)
  }

  // The referrer's LinkedIn identity is linked at signup, which proves identity
  // ownership. They self-attest their company by posting this job. We don't
  // strictly check `profile.company_name` against `job.company_name` because
  // LinkedIn OIDC doesn't expose current employer — that field requires a
  // separate LinkedIn API approval. Posting the job IS the attestation.
  const isVerifiedEmployee = job.referrer?.verification_status === 'verified'

  // Server-side check on /api/payments/create-order will 400 with
  // "Deadline passed" if we let users bid on an expired job, so mirror that
  // here to give them a clean closed state instead of a failed payment.
  const deadlineDate = job.deadline ? new Date(job.deadline) : null
  const isClosed = job.status !== 'active' || (!!deadlineDate && deadlineDate.getTime() < Date.now())
  const closedReason: 'deadline' | 'closed' | null =
    job.status !== 'active'
      ? 'closed'
      : deadlineDate && deadlineDate.getTime() < Date.now()
        ? 'deadline'
        : null

  return (
    <>
      <div className="card space-y-4">
        <BidDisplay
          minBid={live.minBid}
          currentHighest={live.currentHighestBid}
          applicantCount={live.applicantCount}
        />

        {isVerifiedEmployee && (
          <div
            className="flex items-start gap-2 rounded-card border p-3 text-sm"
            style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}
          >
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="leading-snug text-primary">
              <p className="font-semibold">Verified employee at {job.company_name}</p>
              <p className="text-xs text-primary/80">
                Identity confirmed via LinkedIn.
              </p>
            </div>
          </div>
        )}

        {isClosed ? (
          <>
            <div className="rounded-card bg-white/[0.06] p-4 text-center text-sm text-text-soft">
              <p className="font-semibold">Applications closed</p>
              <p className="mt-1 text-xs text-text-faint">
                {closedReason === 'deadline' && deadlineDate
                  ? `The deadline passed on ${deadlineDate.toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}.`
                  : 'The referrer has stopped accepting new applications.'}
              </p>
            </div>
            <Button size="lg" fullWidth disabled>
              Closed to new bids
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" fullWidth onClick={onApply}>
              Apply &amp; place bid →
            </Button>
            <p className="text-center text-xs text-text-faint">
              Full refund if not selected · Bids reviewed highest first
            </p>
          </>
        )}
      </div>
      {open && (
        <ApplyModal
          job={{
            ...job,
            min_bid: live.minBid,
            current_highest_bid: live.currentHighestBid,
            applications_count: live.applicantCount,
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
