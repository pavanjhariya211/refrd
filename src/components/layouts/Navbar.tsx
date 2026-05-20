'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  MessageSquare,
  LogOut,
  User as UserIcon,
  Wallet,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Search,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/Button'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Pick<
    Profile,
    'id' | 'name' | 'profile_photo' | 'user_type'
  > | null>(null)
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
    <header
      className="sticky top-0 z-40 border-b border-border"
      style={{
        background: 'rgba(10, 6, 18, 0.7)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Refrd home">
          {/* Gradient mark anchors the brand on dark surfaces — the
              PNG logo on its own gets lost against the bg. */}
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-[15px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              boxShadow: '0 0 24px rgba(168, 85, 247, 0.4)',
            }}
          >
            R
          </span>
          <span className="text-lg font-semibold tracking-tight text-text">
            Refrd
          </span>
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          <Link
            href="/jobs"
            className="text-sm font-medium text-text-soft transition-colors hover:text-text"
          >
            Browse Jobs
          </Link>

          <div className="relative" onMouseLeave={() => setHowOpen(false)}>
            <button
              onClick={() => setHowOpen((v) => !v)}
              onMouseEnter={() => setHowOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-text-soft transition-colors hover:text-text"
              aria-haspopup="menu"
              aria-expanded={howOpen}
            >
              How it Works
              <ChevronDown
                className={
                  'h-3.5 w-3.5 transition-transform ' +
                  (howOpen ? 'rotate-180' : '')
                }
              />
            </button>
            {howOpen && (
              <div
                role="menu"
                className="absolute left-1/2 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-card border border-border-hi py-1 shadow-card"
                style={{ background: 'rgba(22, 16, 41, 0.95)', backdropFilter: 'blur(12px)' }}
              >
                <Link
                  href="/for-job-seekers"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/5"
                  onClick={() => setHowOpen(false)}
                >
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-violet-bright" />
                  <span>
                    <span className="block text-sm font-semibold text-text">
                      For Job Seekers
                    </span>
                    <span className="block text-xs text-text-soft">
                      Bid for referrals, see your match upfront
                    </span>
                  </span>
                </Link>
                <Link
                  href="/for-referrers"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/5"
                  onClick={() => setHowOpen(false)}
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-bright" />
                  <span>
                    <span className="block text-sm font-semibold text-text">
                      For Referrers
                    </span>
                    <span className="block text-xs text-text-soft">
                      Earn for referrals you&apos;d give anyway
                    </span>
                  </span>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/post-job"
            className="text-sm font-medium text-text-soft transition-colors hover:text-text"
          >
            Post a Job
          </Link>

          <Link
            href="/blogs"
            className="text-sm font-medium text-text-soft transition-colors hover:text-text"
          >
            Blog
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-pill border border-border px-2 py-1 transition-colors hover:bg-white/5"
              >
                <CompanyAvatar name={profile?.name} src={profile?.profile_photo} size="sm" />
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-text-soft sm:inline">
                  {profile?.name ?? 'You'}
                </span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-card border border-border-hi py-1 shadow-card"
                  style={{ background: 'rgba(22, 16, 41, 0.95)', backdropFilter: 'blur(12px)' }}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    href={dashHref}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-soft hover:bg-white/5 hover:text-text"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-soft hover:bg-white/5 hover:text-text"
                  >
                    <MessageSquare className="h-4 w-4" /> Messages
                  </Link>
                  {(profile?.user_type === 'referrer' || profile?.user_type === 'both') && (
                    <Link
                      href="/dashboard/referrer/wallet"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-soft hover:bg-white/5 hover:text-text"
                    >
                      <Wallet className="h-4 w-4" /> Wallet
                    </Link>
                  )}
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-soft hover:bg-white/5 hover:text-text"
                  >
                    <UserIcon className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-sm text-error hover:bg-error/10"
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
          className="md:hidden text-text-soft"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="border-t border-border md:hidden"
          style={{ background: 'rgba(10, 6, 18, 0.95)', backdropFilter: 'blur(16px)' }}
        >
          <nav className="flex flex-col px-4 py-2">
            <Link href="/jobs" className="py-2 text-sm font-medium text-text-soft">
              Browse Jobs
            </Link>
            <Link href="/post-job" className="py-2 text-sm font-medium text-text-soft">
              Post a Job
            </Link>
            <Link href="/blogs" className="py-2 text-sm font-medium text-text-soft">
              Blog
            </Link>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-text-faint">
              How it Works
            </p>
            <Link
              href="/for-job-seekers"
              className="py-2 pl-2 text-sm font-medium text-text-soft"
            >
              For Job Seekers
            </Link>
            <Link
              href="/for-referrers"
              className="py-2 pl-2 text-sm font-medium text-text-soft"
            >
              For Referrers
            </Link>
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                <Link href={dashHref} className="py-2 text-sm font-medium text-text-soft">
                  Dashboard
                </Link>
                <Link href="/messages" className="py-2 text-sm font-medium text-text-soft">
                  Messages
                </Link>
                <Link
                  href="/settings/profile"
                  className="py-2 text-sm font-medium text-text-soft"
                >
                  Settings
                </Link>
                <button
                  onClick={signOut}
                  className="py-2 text-left text-sm font-medium text-error"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="py-2 text-sm font-medium text-text-soft">
                  Log in
                </Link>
                <Link href="/auth/signup" className="py-2 text-sm font-medium text-text-soft">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
