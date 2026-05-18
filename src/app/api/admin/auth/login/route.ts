import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createSession,
  verifyCredentials,
  BLOG_ADMIN_COOKIE,
} from '@/lib/blog-admin-auth'

export const runtime = 'nodejs'

/**
 * POST /api/admin/auth/login — accepts {username, password}, validates
 * against env vars in constant time, and sets the signed session cookie
 * on success. Returns 401 for bad creds, 500 only when the env vars
 * aren't configured (with a guiding message).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const username = String(body?.username ?? '')
  const password = String(body?.password ?? '')
  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required.' },
      { status: 400 }
    )
  }

  const result = verifyCredentials(username, password)
  if (!result.ok) {
    if (result.reason === 'config') {
      return NextResponse.json(
        {
          error:
            'Admin login is not configured. Set ADMIN_BLOG_USERNAME, ADMIN_BLOG_PASSWORD, and ADMIN_SESSION_SECRET on Vercel, then redeploy.',
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const session = createSession()
  cookies().set(BLOG_ADMIN_COOKIE, session.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: session.maxAge,
  })

  return NextResponse.json({ ok: true })
}
