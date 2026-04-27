import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error_description') || searchParams.get('error')

  const supabase = createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?next=/verify`)
  }

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/verify?error=${encodeURIComponent(errorParam)}`
    )
  }

  const linkedinIdentity = user.identities?.find(
    (i) => i.provider === 'linkedin_oidc' || i.provider === 'linkedin'
  )

  if (!linkedinIdentity) {
    return NextResponse.redirect(`${origin}/verify?error=linkedin_not_linked`)
  }

  const data = (linkedinIdentity.identity_data ?? {}) as {
    name?: string
    picture?: string
    avatar_url?: string
    profile_url?: string
    sub?: string
    preferred_username?: string
  }

  // LinkedIn's OIDC claims don't include a public profile URL — just `sub`
  // (a LinkedIn person URN), name, picture, email. We use the link as the
  // verification signal itself; the user's manually-entered linkedin_url stays.
  const linkedinUrl =
    data.profile_url ||
    (data.preferred_username
      ? `https://www.linkedin.com/in/${data.preferred_username}`
      : null)

  // Only patch fields we actually have new values for — never clobber
  // existing user-entered data with null/undefined.
  const update: Record<string, string> = {
    linkedin_verified_at: new Date().toISOString(),
    verification_status: 'verified',
    updated_at: new Date().toISOString(),
  }
  if (linkedinUrl) update.linkedin_url = linkedinUrl
  const photo = data.picture || data.avatar_url
  if (photo) update.profile_photo = photo

  await supabase.from('profiles').update(update).eq('id', user.id)

  return NextResponse.redirect(`${origin}/verify?verified=1`)
}
