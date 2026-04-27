import { cn } from '@/lib/utils'

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card animate-pulse', className)}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-pill bg-slate-100" />
        <div className="h-6 w-20 rounded-pill bg-slate-100" />
        <div className="h-6 w-14 rounded-pill bg-slate-100" />
      </div>
    </div>
  )
}
