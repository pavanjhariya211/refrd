'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Linkedin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import type { UserType } from '@/types'

export default function SignupPage() {
  const [userType, setUserType] = useState<UserType>('jobseeker')
  const [loading, setLoading] = useState(false)

  async function signUpWithLinkedIn() {
    setLoading(true)
    const supabase = createClient()
    // We pass user_type via the redirectTo query so /auth/callback can persist it
    // on the freshly-created profile after the LinkedIn OAuth handshake completes.
    const redirectTo = `${window.location.origin}/auth/callback?user_type=${userType}&next=/dashboard/${userType === 'referrer' ? 'referrer' : 'seeker'}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center" aria-label="Refrd home">
          <Image src="/logo.png" alt="Refrd.club" width={160} height={48} priority className="h-10 w-auto" />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="card w-full">
          <h1 className="text-2xl font-extrabold text-text">Create your account</h1>
          <p className="mt-1 text-sm text-text-soft">
            Pay-on-apply, full refund if not selected. Verified via LinkedIn.
          </p>

          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-medium text-text-soft">I am a…</label>
            <div className="grid grid-cols-3 gap-2">
              {(['jobseeker', 'referrer', 'both'] as UserType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setUserType(t)}
                  className={
                    'rounded-btn border px-3 py-2 text-sm font-medium capitalize ' +
                    (userType === t
                      ? 'border-primary bg-brand-50 text-primary'
                      : 'border-border text-text-soft hover:bg-white/[0.04]')
                  }
                >
                  {t === 'jobseeker' ? 'Job seeker' : t}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={signUpWithLinkedIn}
            loading={loading}
            fullWidth
            size="lg"
            className="mt-5 bg-[#0A66C2] hover:bg-[#0A66C2]/90"
          >
            <Linkedin className="h-4 w-4" />
            Continue with LinkedIn
          </Button>

          <p className="mt-4 text-center text-xs text-text-faint">
            We only read your name, profile URL, email, and avatar. We never post on
            your behalf or read your network.
          </p>

          <p className="mt-6 text-center text-sm text-text-soft">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
