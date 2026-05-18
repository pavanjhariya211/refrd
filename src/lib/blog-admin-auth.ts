/**
 * Standalone username/password auth for /admin/blogs. Decoupled from
 * Supabase Auth so the blog editor doesn't require a LinkedIn login —
 * the operator just signs in with one shared credential pair.
 *
 * The session is an HMAC-signed, base64url-encoded JSON payload stored
 * in an HTTP-only, SameSite=Lax, Secure cookie. No database row, no
 * Supabase session — purely cryptographic.
 *
 * Required env vars (set on Vercel → Settings → Environment Variables):
 *   ADMIN_BLOG_USERNAME    — the login name
 *   ADMIN_BLOG_PASSWORD    — the login password (plaintext is fine; it
 *                            never leaves the server)
 *   ADMIN_SESSION_SECRET   — any random 32+ char string used to sign
 *                            the session cookie. Rotating it logs out
 *                            every active session.
 */
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

export const BLOG_ADMIN_COOKIE = 'refrd_blog_admin'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function getSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export interface BlogAdminSession {
  name: string
  value: string
  maxAge: number
}

export function createSession(): BlogAdminSession {
  const secret = getSecret()
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET env var is not set')
  }
  const exp = Date.now() + MAX_AGE_SECONDS * 1000
  const encoded = Buffer.from(JSON.stringify({ admin: true, exp })).toString(
    'base64url'
  )
  const sig = sign(encoded, secret)
  return {
    name: BLOG_ADMIN_COOKIE,
    value: `${encoded}.${sig}`,
    maxAge: MAX_AGE_SECONDS,
  }
}

/**
 * Reads the cookie from next/headers and verifies the HMAC + expiry.
 * Returns true only if the cookie is present, signed with the current
 * ADMIN_SESSION_SECRET, and not expired.
 */
export function isBlogAdmin(): boolean {
  const secret = getSecret()
  if (!secret) return false

  const raw = cookies().get(BLOG_ADMIN_COOKIE)?.value
  if (!raw) return false

  const [encoded, sig] = raw.split('.')
  if (!encoded || !sig) return false

  let expected: string
  try {
    expected = sign(encoded, secret)
  } catch {
    return false
  }

  // Constant-time compare so a wrong signature length or value can't be
  // distinguished by timing.
  const a = Buffer.from(sig, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false
    return payload.admin === true
  } catch {
    return false
  }
}

/**
 * Constant-time comparison of submitted credentials against the env
 * vars. Returns null when the credentials are wrong or the env isn't
 * configured — never returns *why* so we don't leak which half is bad.
 */
export function verifyCredentials(
  username: string,
  password: string
): { ok: true } | { ok: false; reason: 'config' | 'invalid' } {
  const expectedUser = process.env.ADMIN_BLOG_USERNAME
  const expectedPass = process.env.ADMIN_BLOG_PASSWORD
  if (!expectedUser || !expectedPass || !getSecret()) {
    return { ok: false, reason: 'config' }
  }
  const eqU = constantTimeEqual(username, expectedUser)
  const eqP = constantTimeEqual(password, expectedPass)
  // Evaluate both before returning so timing doesn't reveal which field failed.
  return eqU && eqP ? { ok: true } : { ok: false, reason: 'invalid' }
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) {
    // Still consume time on the shorter side so length isn't leaked.
    timingSafeEqual(ab, ab)
    return false
  }
  return timingSafeEqual(ab, bb)
}
