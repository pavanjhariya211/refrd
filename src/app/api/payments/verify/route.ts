import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'

export const runtime = 'nodejs'

interface Body {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  job_id: string
  bid_amount: number
  resume_url?: string
  resume_text?: string
  cover_note?: string
  linkedin_url?: string
  portfolio_url?: string
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const ok = verifyRazorpaySignature({
    order_id: body.razorpay_order_id,
    payment_id: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  })
  if (!ok) return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 })

  // Use service client to write resume_text — never returned to client.
  const service = createServiceClient()

  // Idempotency: if an application already exists, return it.
  const { data: existing } = await service
    .from('applications')
    .select('id, payment_status')
    .eq('job_id', body.job_id)
    .eq('applicant_id', user.id)
    .maybeSingle()
  if (existing && existing.payment_status === 'paid') {
    return NextResponse.json({ application_id: existing.id })
  }

  const insertResult = await service
    .from('applications')
    .insert({
      job_id: body.job_id,
      applicant_id: user.id,
      resume_url: body.resume_url,
      resume_text: body.resume_text,
      cover_note: body.cover_note,
      linkedin_url: body.linkedin_url,
      portfolio_url: body.portfolio_url,
      bid_amount: body.bid_amount,
      payment_id: body.razorpay_payment_id,
      payment_status: 'paid',
      status: 'applied',
    })
    .select('id')
    .single()

  if (insertResult.error || !insertResult.data) {
    console.error('App insert failed', insertResult.error)
    return NextResponse.json({ error: 'Could not record application' }, { status: 500 })
  }

  const application_id = insertResult.data.id

  await service.from('payments').insert({
    application_id,
    applicant_id: user.id,
    amount: body.bid_amount,
    razorpay_order_id: body.razorpay_order_id,
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_signature: body.razorpay_signature,
    status: 'captured',
    paid_at: new Date().toISOString(),
  })

  // Compute bid rank — count of paid applications on this job with bid >= this bid.
  const { data: ranking } = await service
    .from('applications')
    .select('bid_amount')
    .eq('job_id', body.job_id)
    .eq('payment_status', 'paid')
  const bid_rank =
    ranking?.filter((r) => r.bid_amount > body.bid_amount).length ?? 0
  const total = ranking?.length ?? 1

  // Trigger AI scoring synchronously. We previously fired-and-forgot, but that
  // doesn't work reliably in serverless (the function returns before the fetch
  // completes). Awaiting adds ~5s to checkout but guarantees the score row
  // exists before the seeker hits the success state.
  const scoreUrl = new URL('/api/score-application', request.url).toString()
  try {
    const scoreRes = await fetch(scoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({ application_id }),
    })
    if (!scoreRes.ok) {
      // Don't fail the payment confirmation — the seeker can still see their
      // application in 'scoring…' state and we can retry later.
      console.error('Scoring returned non-OK:', scoreRes.status, await scoreRes.text())
    }
  } catch (err) {
    console.error('Scoring call failed:', err)
  }

  return NextResponse.json({
    application_id,
    bid_rank: bid_rank + 1,
    total,
  })
}
