import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { APPLY_AUTO_REFUND_DAYS } from '@/lib/constants'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const cutoff = new Date(Date.now() - APPLY_AUTO_REFUND_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: stale } = await service
    .from('applications')
    .select('id, job_id')
    .eq('payment_status', 'paid')
    .eq('status', 'applied')
    .lt('created_at', cutoff)

  if (!stale?.length) return NextResponse.json({ refunded: 0 })

  let count = 0
  for (const app of stale) {
    try {
      const url = new URL('/api/payments/refund', request.url).toString()
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ application_id: app.id, reason: 'auto-refund (no response in 7 days)' }),
      })
      if (res.ok) count++
    } catch (err) {
      console.error('auto-refund failed for', app.id, err)
    }
  }

  return NextResponse.json({ refunded: count })
}

export const POST = GET
