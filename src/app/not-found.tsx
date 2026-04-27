import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-50 to-white p-4 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-2xl font-bold text-slate-900">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-slate-600">
        The link may be broken, or the job may have been removed.
      </p>
      <Link href="/jobs">
        <Button>Browse jobs</Button>
      </Link>
    </div>
  )
}
