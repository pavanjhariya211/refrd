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

// Primary is the gradient violet-button from the reference — sits on
// every CTA in the site. Outline is the subtle glass-bordered companion
// used for secondary actions (e.g. "See how it works"). Ghost has no
// chrome at all; used only in the navbar.
const variantStyles: Record<Variant, string> = {
  primary:
    'text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_0_0_1px_rgba(168,85,247,0.4),0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:-translate-y-px hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_0_0_1px_rgba(168,85,247,0.6),0_12px_32px_-8px_rgba(168,85,247,0.8)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
  secondary:
    'bg-bg-card-hi text-text border border-border-hi hover:bg-white/[0.08]',
  ghost: 'bg-transparent text-text-soft hover:text-text hover:bg-white/[0.04]',
  outline:
    'bg-white/[0.02] text-text border border-border-hi hover:bg-white/[0.06] hover:border-white/25',
  danger:
    'bg-error text-white hover:bg-error/90 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)]',
  success:
    'bg-success text-white hover:bg-success/90 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-btn',
  md: 'h-10 px-[18px] text-sm rounded-btn',
  lg: 'h-12 px-6 text-[15px] rounded-[12px]',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading,
    fullWidth,
    disabled,
    children,
    style,
    ...rest
  },
  ref
) {
  // The primary variant uses a gradient that can't be expressed cleanly
  // in a Tailwind class chain (no arbitrary linear-gradient support
  // without bg-[..] escaping), so apply it via inline style.
  const inlineStyle =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
          ...style,
        }
      : style

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={inlineStyle}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet/30 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
