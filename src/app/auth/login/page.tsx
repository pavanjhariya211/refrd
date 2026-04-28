'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Briefcase, Linkedin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const search = useSearchParams()
  const next = search.get('next') ?? '/'
  const [loading, setLoading] = useState(false)

  async function signInWithLinkedIn() {
    setLoading(true)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
    // On success Supabase navigates the browser to LinkedIn — no further work here.
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-white">
      <header className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-primary text-white">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">Refrd</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="card w-full">
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to continue your search.
          </p>

          <Button
            onClick={signInWithLinkedIn}
            loading={loading}
            fullWidth
            size="lg"
            className="mt-6 bg-[#0A66C2] hover:bg-[#0A66C2]/90"
          >
            <Linkedin className="h-4 w-4" />
            Continue with LinkedIn
          </Button>

          <p className="mt-4 text-center text-xs text-slate-500">
            We use LinkedIn to verify employee identity. We never read your network or
            post on your behalf.
          </p>

          <p className="mt-6 text-center text-sm text-slate-600">
            New here?{' '}
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
