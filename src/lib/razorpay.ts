import Razorpay from 'razorpay'
import { createHmac } from 'crypto'

let cachedClient: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (cachedClient) return cachedClient
  cachedClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
  return cachedClient
}

export function verifyRazorpaySignature({
  order_id,
  payment_id,
  signature,
}: {
  order_id: string
  payment_id: string
  signature: string
}): boolean {
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${order_id}|${payment_id}`)
    .digest('hex')
  return expected === signature
}
