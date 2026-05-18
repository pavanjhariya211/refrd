'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function AdminSignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function signOut() {
    setBusy(true)
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }
  return (
    <Button variant="outline" size="sm" onClick={signOut} loading={busy}>
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </Button>
  )
}
