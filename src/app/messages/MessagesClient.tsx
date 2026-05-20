'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useMessages } from '@/hooks/useMessages'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'
import { formatRelativeTime } from '@/lib/utils'

interface Conv {
  id: string
  status: string
  bid_amount: number
  applicant?: { id: string; name?: string; profile_photo?: string; headline?: string }
  job?: { id: string; title: string; company_name: string; referrer_id: string }
}

interface Props {
  userId: string
  asApplicant: Conv[]
  asReferrer: Conv[]
  initialApplicationId?: string
}

export function MessagesClient({ userId, asApplicant, asReferrer, initialApplicationId }: Props) {
  const all = useMemo(
    () => [
      ...asApplicant.map((c) => ({
        ...c,
        peerName: c.job?.company_name,
        peerInitials: c.job?.company_name,
        receiverId: c.job?.referrer_id ?? '',
      })),
      ...asReferrer.map((c) => ({
        ...c,
        peerName: c.applicant?.name ?? 'Applicant',
        peerInitials: c.applicant?.name ?? 'A',
        receiverId: c.applicant?.id ?? '',
      })),
    ],
    [asApplicant, asReferrer]
  )

  const [activeId, setActiveId] = useState<string | undefined>(
    initialApplicationId || all[0]?.id
  )
  const active = all.find((c) => c.id === activeId)
  const { messages } = useMessages(activeId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  async function sendMessage() {
    if (!text.trim() || !active) return
    setSending(true)
    try {
      const supabase = createClient()
      await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: active.receiverId,
        application_id: active.id,
        content: text.trim(),
      })
      setText('')
    } finally {
      setSending(false)
    }
  }

  if (all.length === 0) {
    return (
      <div className="card text-center text-sm text-text-soft">
        No conversations yet. Apply to a job or wait for an applicant to start a thread.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <aside className="card max-h-[70vh] overflow-y-auto p-2">
        {all.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={
              'flex w-full items-center gap-2 rounded-input px-2 py-2 text-left ' +
              (activeId === c.id ? 'bg-brand-50' : 'hover:bg-white/[0.04]')
            }
          >
            <CompanyAvatar name={c.peerInitials} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.peerName}</p>
              <p className="truncate text-xs text-text-faint">{c.job?.title}</p>
            </div>
          </button>
        ))}
      </aside>

      <section className="card flex h-[70vh] flex-col p-0">
        {active && (
          <header className="border-b border-border px-4 py-3">
            <p className="text-sm font-bold">{active.job?.title}</p>
            <p className="text-xs text-text-faint">{active.job?.company_name}</p>
          </header>
        )}
        <div ref={scrollerRef} className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m) => {
            const me = m.sender_id === userId
            return (
              <div key={m.id} className={'flex ' + (me ? 'justify-end' : 'justify-start')}>
                <div
                  className={
                    'max-w-[70%] rounded-card px-3 py-2 text-sm ' +
                    (me ? 'bg-primary text-white' : 'bg-white/[0.06] text-text')
                  }
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={'mt-1 text-[10px] ' + (me ? 'text-white/70' : 'text-text-faint')}>
                    {formatRelativeTime(m.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
          {messages.length === 0 && (
            <p className="py-8 text-center text-xs text-text-faint">
              No messages yet. Say hi.
            </p>
          )}
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <Button onClick={sendMessage} loading={sending} disabled={!text.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-text-faint">⌘/Ctrl + Enter to send</p>
        </div>
      </section>
    </div>
  )
}
