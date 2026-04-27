'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { UserType } from '@/types'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<UserType>('jobseeker')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setLoading(false)
      toast.error(error.message)
      return
    }
    if (data.user) {
      // Set user_type via update — the trigger creates a baseline profile from auth metadata.
      await supabase
        .from('profiles')
        .update({ user_type: userType, name })
        .eq('id', data.user.id)
    }
    setLoading(false)
    toast.success('Account created. Check your email to confirm.')
    router.replace('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-white">
      <header className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-primary text-white">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">RefHire</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="card w-full">
          <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pay-on-apply, full refund if not selected.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="Full name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
              minLength={8}
              required
              autoComplete="new-password"
              hint="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">I am a…</label>
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
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                    }
                  >
                    {t === 'jobseeker' ? 'Job seeker' : t}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" loading={loading} fullWidth>
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
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
