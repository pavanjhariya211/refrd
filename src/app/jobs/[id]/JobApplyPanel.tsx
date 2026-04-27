'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  return (
    <>
      <div className="card space-y-4">
        <BidDisplay
          minBid={live.minBid}
          currentHighest={live.currentHighestBid}
          applicantCount={live.applicantCount}
        />
        <Button size="lg" fullWidth onClick={onApply}>
          Apply &amp; place bid →
        </Button>
        <p className="text-center text-xs text-slate-500">
          Full refund if not selected · Bids reviewed highest first
        </p>
      </div>
      {open && (
        <ApplyModal
          job={{ ...job, ...{
            min_bid: live.minBid,
            current_highest_bid: live.currentHighestBid,
            applications_count: live.applicantCount,
          } }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
