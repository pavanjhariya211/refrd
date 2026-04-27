'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PUBLIC_REFERRER_FIELDS } from '@/lib/constants'
import type { JobPost } from '@/types'
import type { JobFilters } from '@/components/layouts/FilterSidebar'

export function useJobs(filters: JobFilters) {
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    async function run() {
      setLoading(true)
      let query = supabase
        .from('job_posts')
        .select(`*, referrer:profiles!referrer_id(${PUBLIC_REFERRER_FIELDS})`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (filters.q) {
        query = query.or(
          `title.ilike.%${filters.q}%,company_name.ilike.%${filters.q}%,description.ilike.%${filters.q}%`
        )
      }
      if (filters.locationType) query = query.eq('location_type', filters.locationType)
      if (filters.experienceLevel) query = query.eq('experience_level', filters.experienceLevel)

      const { data } = await query.limit(50)
      if (!active) return
      let result = (data as unknown as JobPost[]) ?? []
      if (filters.hasVerified) {
        result = result.filter((j) => j.referrer?.verification_status === 'verified')
      }
      setJobs(result)
      setLoading(false)
    }
    run()
    return () => {
      active = false
    }
  }, [filters.q, filters.locationType, filters.experienceLevel, filters.hasVerified])

  return { jobs, loading }
}
