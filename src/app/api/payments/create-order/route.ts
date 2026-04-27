import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const job_id = body?.job_id as string
  const bid_amount = Number(body?.bid_amount)
  if (!job_id || !Number.isFinite(bid_amount) || bid_amount <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { data: job } = await supabase
    .from('job_posts')
    .select('id, status, deadline, min_bid')
    .eq('id', job_id)
    .single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'active') return NextResponse.json({ error: 'Job is not accepting applications' }, { status: 400 })
  if (job.deadline && new Date(job.deadline) < new Date()) {
    return NextResponse.json({ error: 'Deadline passed' }, { status: 400 })
  }
  if (bid_amount < job.min_bid) {
    return NextResponse.json(
      { error: `Bid below minimum of ₹${job.min_bid}` },
      { status: 400 }
    )
  }

  const { data: existing } = await supabase
    .from('applications')
    .select('id, payment_status')
    .eq('job_id', job_id)
    .eq('applicant_id', user.id)
    .maybeSingle()
  if (existing && existing.payment_status === 'paid') {
    return NextResponse.json({ error: 'You already applied to this job' }, { status: 409 })
  }

  try {
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: bid_amount * 100, // paise
      currency: 'INR',
      receipt: `app_${job_id.slice(0, 8)}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { job_id, applicant_id: user.id, bid_amount: String(bid_amount) },
    })
    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('Razorpay order failed:', err)
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
  }
}
