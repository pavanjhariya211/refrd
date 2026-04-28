'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Linkedin } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useLiveBid } from '@/hooks/useLiveBid'
import { Button } from '@/components/ui/Button'
import { BidDisplay } from '@/components/ui/BidDisplay'
import { ApplyModal } from '@/components/forms/ApplyModal'
import type { JobPost } from '@/types'

interface Props {
  job: JobPost
}

function normaliseCompany(value?: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
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

  // The referrer's LinkedIn identity is linked at signup (LinkedIn-only auth)
  // and their company_name is self-attested on profile. Treat it as a verified
  // employee match when the company on the job equals the company on the
  // referrer's profile, case-insensitive.
  const referrerVerified = job.referrer?.verification_status === 'verified'
  const companyMatches =
    !!job.referrer?.company_name &&
    normaliseCompany(job.referrer.company_name) === normaliseCompany(job.company_name)
  const isVerifiedEmployee = referrerVerified && companyMatches

  return (
    <>
      <div className="card space-y-4">
        <BidDisplay
          minBid={live.minBid}
          currentHighest={live.currentHighestBid}
          applicantCount={live.applicantCount}
        />

        {isVerifiedEmployee ? (
          <div
            className="flex items-start gap-2 rounded-card border p-3 text-sm"
            style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}
          >
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="leading-snug text-primary">
              <p className="font-semibold">Verified employee</p>
              <p className="text-xs text-primary/80">
                LinkedIn-confirmed and listed at {job.company_name}.
              </p>
            </div>
          </div>
        ) : referrerVerified ? (
          <div
            className="flex items-start gap-2 rounded-card border p-3 text-sm"
            style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
          >
            <Linkedin className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="leading-snug text-warning">
              <p className="font-semibold">LinkedIn-verified referrer</p>
              <p className="text-xs">
                We could not match their profile employer to {job.company_name}.
              </p>
            </div>
          </div>
        ) : null}

        <Button size="lg" fullWidth onClick={onApply}>
          Apply &amp; place bid →
        </Button>
        <p className="text-center text-xs text-slate-500">
          Full refund if not selected · Bids reviewed highest first
        </p>
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
