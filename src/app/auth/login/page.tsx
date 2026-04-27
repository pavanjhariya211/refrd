'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Welcome back!')
    router.replace(next)
    router.refresh()
  }

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
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
          <p className="mt-1 text-sm text-slate-600">Sign in to continue your search.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              type="email"
              label="Email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              label="Password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} fullWidth>
              Sign in
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
          </div>
          <Button variant="outline" fullWidth onClick={signInWithGoogle}>
            Continue with Google
          </Button>
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
