'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-50 to-white p-4 text-center">
      <p className="text-6xl font-extrabold text-error">Oops</p>
      <h1 className="text-2xl font-bold text-slate-900">Something broke on our end</h1>
      <p className="max-w-md text-slate-600">
        Our team has been notified. Try the action again — most issues are transient.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
      {error.digest && (
        <p className="mt-3 text-xs text-slate-400">Error ID: {error.digest}</p>
      )}
    </div>
  )
}
