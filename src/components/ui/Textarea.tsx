import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, hint, showCount, className, id, value, maxLength, ...rest },
  ref
) {
  const textareaId = id || rest.name
  const length = typeof value === 'string' ? value.length : 0
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-2 block text-[11px] uppercase tracking-widest text-muted"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        value={value}
        maxLength={maxLength}
        className={cn(
          'input-base min-h-[100px] resize-y leading-relaxed',
          error && 'border-error focus:border-error',
          className
        )}
        {...rest}
      />
      <div className="mt-1 flex items-start justify-between gap-2">
        <div className="text-[11px]">
          {error ? (
            <span className="text-error">{error}</span>
          ) : hint ? (
            <span className="text-muted">{hint}</span>
          ) : null}
        </div>
        {showCount && (
          <span
            className="text-[11px] text-muted"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {length}
            {maxLength ? `/${maxLength}` : ''}
          </span>
        )}
      </div>
    </div>
  )
})
