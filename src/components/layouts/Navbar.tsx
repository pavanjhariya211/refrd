'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { MessageSquare, LogOut, User as UserIcon, Wallet, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/Button'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Pick<Profile, 'id' | 'name' | 'profile_photo' | 'user_type'> | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
      className={cn(
        'sticky top-0 z-40 transition-all duration-200',
        scrolled
          ? 'bg-ink/90 backdrop-blur-md border-b border-line'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20">
        <Link href="/" className="flex items-center" aria-label="Refrd home">
          <Image
            src="/logo.png"
            alt="Refrd.ai"
            width={160}
            height={48}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          <Link
            href="/jobs"
            className="text-[13px] font-medium text-paper hover:text-accent transition-colors"
          >
            Browse Jobs
          </Link>

          <div className="relative" onMouseLeave={() => setHowOpen(false)}>
            <button
              onClick={() => setHowOpen((v) => !v)}
              onMouseEnter={() => setHowOpen(true)}
              className="flex items-center gap-1 text-[13px] font-medium text-paper hover:text-accent transition-colors"
              aria-haspopup="menu"
              aria-expanded={howOpen}
            >
              How it Works
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  howOpen && 'rotate-180'
                )}
              />
            </button>
            {howOpen && (
              <div
                role="menu"
                className="absolute left-1/2 mt-2 w-64 -translate-x-1/2 bg-card border border-line"
              >
                <Link
                  href="/for-job-seekers"
                  className="block px-4 py-3 hover:bg-chip transition-colors"
                  onClick={() => setHowOpen(false)}
                >
                  <p className="text-[13px] font-semibold text-paper">For Job Seekers</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Bid for referrals, see your match upfront
                  </p>
                </Link>
                <div className="border-t border-line" />
                <Link
                  href="/for-referrers"
                  className="block px-4 py-3 hover:bg-chip transition-colors"
                  onClick={() => setHowOpen(false)}
                >
                  <p className="text-[13px] font-semibold text-paper">For Referrers</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Earn for referrals you&apos;d give anyway
                  </p>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/post-job"
            className="text-[13px] font-medium text-paper hover:text-accent transition-colors"
          >
            Post a Job
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 border border-line px-2 py-1 hover:border-accent transition-colors"
              >
                <CompanyAvatar name={profile?.name} src={profile?.profile_photo} size="sm" />
                <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-paper sm:inline">
                  {profile?.name ?? 'You'}
                </span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-card border border-line"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link href={dashHref} className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-chip hover:text-accent transition-colors">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                  </Link>
                  <Link href="/messages" className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-chip hover:text-accent transition-colors">
                    <MessageSquare className="h-3.5 w-3.5" /> Messages
                  </Link>
                  {(profile?.user_type === 'referrer' || profile?.user_type === 'both') && (
                    <Link href="/dashboard/referrer/wallet" className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-chip hover:text-accent transition-colors">
                      <Wallet className="h-3.5 w-3.5" /> Wallet
                    </Link>
                  )}
                  <Link href="/settings/profile" className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-chip hover:text-accent transition-colors">
                    <UserIcon className="h-3.5 w-3.5" /> Settings
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-[13px] text-error hover:bg-chip transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/jobs" className="text-[13px] font-medium text-paper hover:text-accent transition-colors">
                Browse jobs
              </Link>
              <Link href="/auth/login" className="text-[13px] font-medium text-paper hover:text-accent transition-colors">
                Log in
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="text-paper md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-ink md:hidden">
          <nav className="flex flex-col px-4 py-3">
            <Link href="/jobs" className="py-2.5 text-[13px] font-medium text-paper hover:text-accent">
              Browse Jobs
            </Link>
            <Link href="/post-job" className="py-2.5 text-[13px] font-medium text-paper hover:text-accent">
              Post a Job
            </Link>
            <p
              className="mt-3 text-[10px] uppercase tracking-widest text-faint"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              How it Works
            </p>
            <Link href="/for-job-seekers" className="py-2.5 pl-3 text-[13px] font-medium text-paper hover:text-accent">
              For Job Seekers
            </Link>
            <Link href="/for-referrers" className="py-2.5 pl-3 text-[13px] font-medium text-paper hover:text-accent">
              For Referrers
            </Link>
            <div className="my-2 border-t border-line" />
            {user ? (
              <>
                <Link href={dashHref} className="py-2.5 text-[13px] font-medium text-paper hover:text-accent">Dashboard</Link>
                <Link href="/messages" className="py-2.5 text-[13px] font-medium text-paper hover:text-accent">Messages</Link>
                <Link href="/settings/profile" className="py-2.5 text-[13px] font-medium text-paper hover:text-accent">Settings</Link>
                <button onClick={signOut} className="py-2.5 text-left text-[13px] font-medium text-error">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="py-2.5 text-[13px] font-medium text-paper hover:text-accent">Log in</Link>
                <Link href="/auth/signup" className="py-2.5">
                  <Button size="sm" fullWidth>Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
