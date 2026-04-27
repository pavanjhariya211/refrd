'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      const { data } = await supabase.auth.getUser()
      if (!active) return
      setUser(data.user)
      if (data.user) {
        // Note: never select work_email — public-facing client should never read it.
        const { data: p } = await supabase
          .from('profiles')
          .select(
            'id, email, name, profile_photo, headline, location, bio, user_type, verification_status, company_name, linkedin_url, github_url, skills, reputation_score, total_referrals, successful_referrals, avg_response_days, is_open_to_work, created_at, updated_at'
          )
          .eq('id', data.user.id)
          .single()
        if (active) setProfile(p as Profile | null)
      }
      if (active) setLoading(false)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading, setProfile }
}
