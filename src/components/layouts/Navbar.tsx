'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Briefcase, MessageSquare, LogOut, User as UserIcon, Wallet, LayoutDashboard, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/Button'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Pick<Profile, 'id' | 'name' | 'profile_photo' | 'user_type'> | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-primary text-white">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">Refrd</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/jobs" className="text-sm font-medium text-slate-700 hover:text-primary">
              Browse Jobs
            </Link>
            <Link href="/post-job" className="text-sm font-medium text-slate-700 hover:text-primary">
              Post a Job
            </Link>
          </nav>
        </div>

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
