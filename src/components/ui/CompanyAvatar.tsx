import { cn, getInitials } from '@/lib/utils'

interface Props {
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  src?: string | null
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

function hashColor(seed: string): string {
  const colors = [
    'bg-blue-500/15 text-blue-300',
    'bg-purple-500/15 text-purple-300',
    'bg-pink-100 text-pink-700',
    'bg-orange-500/15 text-orange-300',
    'bg-emerald-500/15 text-emerald-300',
    'bg-amber-500/15 text-amber-300',
    'bg-cyan-500/15 text-cyan-300',
    'bg-indigo-500/15 text-indigo-300',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0xfffffff
  return colors[hash % colors.length]
}

export function CompanyAvatar({ name, size = 'md', src, className }: Props) {
  const initials = getInitials(name)
  const color = hashColor(name || 'X')
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'avatar'}
        className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizes[size],
        color,
        className
      )}
      aria-label={name ?? 'avatar'}
    >
      {initials}
    </div>
  )
}
