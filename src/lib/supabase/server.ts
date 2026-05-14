import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createBareClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — ignore
          }
        },
      },
    }
  )
}

export const createServiceClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
}

/**
 * Cookie-free anon client for public reads (active job posts, public
 * profiles). Because it never touches `cookies()`, pages that use it
 * are NOT forced into dynamic rendering — they can be statically
 * generated or ISR-revalidated. RLS still applies via the anon key,
 * so only data the "public" policies expose is readable. Never use
 * this where you need the signed-in user's identity.
 */
export const createPublicClient = () =>
  createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
