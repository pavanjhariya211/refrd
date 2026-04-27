'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSavedJobs(userId?: string) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        setSavedIds(new Set((data ?? []).map((d: { job_id: string }) => d.job_id)))
      })
  }, [userId])

  const toggle = useCallback(
    async (jobId: string) => {
      if (!userId) return
      const supabase = createClient()
      if (savedIds.has(jobId)) {
        await supabase.from('saved_jobs').delete().eq('user_id', userId).eq('job_id', jobId)
        setSavedIds((prev) => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
      } else {
        await supabase.from('saved_jobs').insert({ user_id: userId, job_id: jobId })
        setSavedIds((prev) => new Set(prev).add(jobId))
      }
    },
    [userId, savedIds]
  )

  return { savedIds, toggle }
}
