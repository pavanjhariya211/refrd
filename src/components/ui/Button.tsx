import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

// Brutally-minimal button variants. Sharp corners, no shadows.
// Primary: acid yellow / black, uppercase, tracking-wide — the only filled CTA.
// Secondary / Outline: transparent + 1px white border. Hover flips to accent border.
// Ghost: text only, underline on hover.
// Danger / Success: state buttons — keep semantic for refund/refer flows.
const variantStyles: Record<Variant, string> = {
  primary:
    'bg-accent text-black font-bold uppercase tracking-widest hover:bg-accent/90 disabled:opacity-40',
  secondary:
    'bg-transparent text-paper border border-paper hover:border-accent hover:text-accent uppercase tracking-widest disabled:opacity-40',
  outline:
    'bg-transparent text-paper border border-paper hover:border-accent hover:text-accent uppercase tracking-widest disabled:opacity-40',
  ghost:
    'bg-transparent text-paper hover:text-accent hover:underline underline-offset-4 disabled:opacity-40',
  danger:
    'bg-error text-black font-bold uppercase tracking-widest hover:bg-error/90 disabled:opacity-40',
  success:
    'bg-success text-black font-bold uppercase tracking-widest hover:bg-success/90 disabled:opacity-40',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-3 text-[11px]',
  md: 'h-11 px-5 text-xs',
  lg: 'h-12 px-6 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'primary', size = 'md', loading, fullWidth, disabled, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 focus:outline-none disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      style={{ borderRadius: 0 }}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
