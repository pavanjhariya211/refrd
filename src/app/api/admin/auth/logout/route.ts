import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { BLOG_ADMIN_COOKIE } from '@/lib/blog-admin-auth'

export const runtime = 'nodejs'

export async function POST() {
  cookies().delete(BLOG_ADMIN_COOKIE)
  return NextResponse.json({ ok: true })
}
