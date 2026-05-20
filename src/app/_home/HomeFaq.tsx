'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

export function HomeFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={item.q}
            onClick={() => setOpen(isOpen ? null : i)}
            className="cursor-pointer rounded-[14px] border p-6 transition-all"
            style={{
              background: isOpen
                ? 'rgba(29, 22, 53, 0.6)'
                : 'rgba(22, 16, 41, 0.4)',
              borderColor: isOpen
                ? 'rgba(168, 85, 247, 0.3)'
                : 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <span className="text-[17px] font-medium leading-snug tracking-[-0.015em]">
                {item.q}
              </span>
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all"
                style={{
                  background: isOpen
                    ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'
                    : 'transparent',
                  borderColor: isOpen ? 'transparent' : 'rgba(255,255,255,0.14)',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                }}
              >
                <Plus
                  className="h-4 w-4"
                  style={{ color: isOpen ? '#fff' : '#b5acc9' }}
                />
              </span>
            </div>
            <div
              className="overflow-hidden text-[15px] leading-[1.65] text-text-soft transition-all duration-300"
              style={{
                maxHeight: isOpen ? '500px' : '0',
                marginTop: isOpen ? '14px' : '0',
              }}
            >
              {item.a}
            </div>
          </div>
        )
      })}
    </div>
  )
}
