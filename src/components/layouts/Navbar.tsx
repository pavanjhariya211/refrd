'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { MessageSquare, LogOut, User as UserIcon, Wallet, LayoutDashboard, Menu, X, ChevronDown, Search, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/Button'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Pick<Profile, 'id' | 'name' | 'profile_photo' | 'user_type'> | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, user_type')
          .eq('id', data.user.id)
          .single()
        setProfile(p ?? null)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const dashHref =
    profile?.user_type === 'referrer' || profile?.user_type === 'both'
      ? '/dashboard/referrer'
      : '/dashboard/seeker'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
        <Link href="/" className="flex items-center" aria-label="Refrd home">
          <Image
            src="/logo.png"
            alt="Refrd.ai"
            width={220}
            height={48}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 md:flex">
          <Link href="/jobs" className="text-sm font-medium text-slate-700 hover:text-primary">
            Browse Jobs
          </Link>

          <div className="relative" onMouseLeave={() => setHowOpen(false)}>
            <button
              onClick={() => setHowOpen((v) => !v)}
              onMouseEnter={() => setHowOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-primary"
              aria-haspopup="menu"
              aria-expanded={howOpen}
            >
              How it Works
              <ChevronDown className={'h-3.5 w-3.5 transition-transform ' + (howOpen ? 'rotate-180' : '')} />
            </button>
            {howOpen && (
              <div
                role="menu"
                className="absolute left-1/2 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-card border border-slate-200 bg-white py-1 shadow-card-hover"
              >
                <Link
                  href="/for-job-seekers"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                  onClick={() => setHowOpen(false)}
                >
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      For Job Seekers
                    </span>
                    <span className="block text-xs text-slate-500">
                      Bid for referrals, see your match upfront
                    </span>
                  </span>
                </Link>
                <Link
                  href="/for-referrers"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                  onClick={() => setHowOpen(false)}
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      For Referrers
                    </span>
                    <span className="block text-xs text-slate-500">
                      Earn for referrals you&apos;d give anyway
                    </span>
                  </span>
                </Link>
              </div>
            )}
          </div>

          <Link href="/post-job" className="text-sm font-medium text-slate-700 hover:text-primary">
            Post a Job
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-pill border border-slate-200 px-2 py-1 hover:bg-slate-50"
              >
                <CompanyAvatar name={profile?.name} src={profile?.profile_photo} size="sm" />
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:inline">
                  {profile?.name ?? 'You'}
                </span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-card border border-slate-200 bg-white py-1 shadow-card-hover"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link href={dashHref} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link href="/messages" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                    <MessageSquare className="h-4 w-4" /> Messages
                  </Link>
                  {(profile?.user_type === 'referrer' || profile?.user_type === 'both') && (
                    <Link href="/dashboard/referrer/wallet" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                      <Wallet className="h-4 w-4" /> Wallet
                    </Link>
                  )}
                  <Link href="/settings/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                    <UserIcon className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-sm text-error hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="flex flex-col px-4 py-2">
            <Link href="/jobs" className="py-2 text-sm font-medium">Browse Jobs</Link>
            <Link href="/post-job" className="py-2 text-sm font-medium">Post a Job</Link>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              How it Works
            </p>
            <Link href="/for-job-seekers" className="py-2 pl-2 text-sm font-medium">
              For Job Seekers
            </Link>
            <Link href="/for-referrers" className="py-2 pl-2 text-sm font-medium">
              For Referrers
            </Link>
            <div className="my-2 h-px bg-slate-100" />
            {user ? (
              <>
                <Link href={dashHref} className="py-2 text-sm font-medium">Dashboard</Link>
                <Link href="/messages" className="py-2 text-sm font-medium">Messages</Link>
                <Link href="/settings/profile" className="py-2 text-sm font-medium">Settings</Link>
                <button onClick={signOut} className="py-2 text-left text-sm font-medium text-error">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="py-2 text-sm font-medium">Log in</Link>
                <Link href="/auth/signup" className="py-2 text-sm font-medium">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
