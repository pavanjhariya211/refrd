'use client'

import { useEffect, useId, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types'

export function useMessages(applicationId?: string) {
  const subscriptionId = useId()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!applicationId) {
      setLoading(false)
      return
    }
    const supabase = createClient()
    let active = true

    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(id, name, profile_photo)')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true })
      if (active) {
        setMessages((data as unknown as Message[]) ?? [])
        setLoading(false)
      }
    }
    load()

    // Unique per subscriber — see useLiveBid for the same-channel-name pitfall.
    const channel = supabase
      .channel(`messages:${applicationId}:${subscriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [applicationId, subscriptionId])

  return { messages, loading }
}
