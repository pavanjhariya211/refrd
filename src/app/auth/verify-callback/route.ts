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

  // The LinkedIn OIDC provider doesn't always return a public profile URL directly,
  // but the `sub` claim plus the LinkedIn vanity is enough to construct one. Fall
  // back to whatever Supabase saved on `identity_data`.
  const linkedinUrl =
    data.profile_url ||
    (data.preferred_username
      ? `https://www.linkedin.com/in/${data.preferred_username}`
      : undefined)

  await supabase
    .from('profiles')
    .update({
      linkedin_url: linkedinUrl ?? null,
      linkedin_verified_at: new Date().toISOString(),
      verification_status: 'verified',
      profile_photo: data.picture || data.avatar_url || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  return NextResponse.redirect(`${origin}/verify?verified=1`)
}
