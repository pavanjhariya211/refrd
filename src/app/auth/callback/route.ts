import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserType } from '@/types'

const VALID_USER_TYPES: ReadonlyArray<UserType> = ['jobseeker', 'referrer', 'both']

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const userTypeParam = searchParams.get('user_type')

  const supabase = createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const linkedinIdentity = user.identities?.find(
    (i) => i.provider === 'linkedin_oidc' || i.provider === 'linkedin'
  )

  // Build the profile patch from whatever signals we have. We never overwrite
  // a non-empty user-edited field with null.
  const patch: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  }

  if (linkedinIdentity) {
    const data = (linkedinIdentity.identity_data ?? {}) as {
      name?: string
      picture?: string
      avatar_url?: string
      profile_url?: string
      preferred_username?: string
    }

    patch.verification_status = 'verified'
    patch.linkedin_verified_at = new Date().toISOString()

    const linkedinUrl =
      data.profile_url ||
      (data.preferred_username
        ? `https://www.linkedin.com/in/${data.preferred_username}`
        : null)
    if (linkedinUrl) patch.linkedin_url = linkedinUrl

    const photo = data.picture || data.avatar_url
    if (photo) patch.profile_photo = photo

    if (data.name) patch.name = data.name
  }

  if (userTypeParam && VALID_USER_TYPES.includes(userTypeParam as UserType)) {
    patch.user_type = userTypeParam
  }

  // Single update, RLS allows the user to edit their own row.
  await supabase.from('profiles').update(patch).eq('id', user.id)

  return NextResponse.redirect(`${origin}${next}`)
}
