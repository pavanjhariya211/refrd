'use client'

import { useEffect, useId, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveBid {
  currentHighestBid: number
  applicantCount: number
  minBid: number
}

export function useLiveBid(jobId: string, initial?: Partial<LiveBid>): LiveBid {
  const subscriptionId = useId()
  const [state, setState] = useState<LiveBid>({
    currentHighestBid: initial?.currentHighestBid ?? 0,
    applicantCount: initial?.applicantCount ?? 0,
    minBid: initial?.minBid ?? 0,
  })

  useEffect(() => {
    if (!jobId) return
    const supabase = createClient()

    let cancelled = false
    async function fetchOnce() {
      const { data } = await supabase
        .from('job_posts')
        .select('current_highest_bid, applications_count, min_bid')
        .eq('id', jobId)
        .single()
      if (!cancelled && data) {
        setState({
          currentHighestBid: data.current_highest_bid ?? 0,
          applicantCount: data.applications_count ?? 0,
          minBid: data.min_bid ?? 0,
        })
      }
    }
    fetchOnce()

    // Channel names must be unique per subscriber. Two components can't
    // call .on() after .subscribe() on the same channel — Supabase returns
    // the existing channel, and adding a listener post-subscribe throws.
    const channel = supabase
      .channel(`job_posts:${jobId}:${subscriptionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'job_posts', filter: `id=eq.${jobId}` },
        (payload) => {
          const next = payload.new as { current_highest_bid: number; applications_count: number; min_bid: number }
          setState({
            currentHighestBid: next.current_highest_bid ?? 0,
            applicantCount: next.applications_count ?? 0,
            minBid: next.min_bid ?? 0,
          })
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [jobId, subscriptionId])

  return state
}
