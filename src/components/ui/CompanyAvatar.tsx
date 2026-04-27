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
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-orange-100 text-orange-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
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
