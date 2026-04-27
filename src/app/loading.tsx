import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
