import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export const fieldBase = [
  'w-full rounded-md border border-border-strong bg-surface text-fg placeholder:text-fg-subtle',
  'transition-[border-color,box-shadow] duration-(--duration-fast)',
  'hover:border-fg-subtle focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40',
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
  'aria-invalid:border-danger aria-invalid:focus-visible:outline-danger/30',
  // 16px on small screens stops iOS from zooming into focused fields.
  'text-base sm:text-sm',
].join(' ')

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  startIcon?: ReactNode
  endSlot?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, startIcon, endSlot, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      className={cn(fieldBase, 'h-11 px-3.5', startIcon && 'ps-10', endSlot && 'pe-11', className)}
      {...props}
    />
  )
  if (!startIcon && !endSlot) return input
  return (
    <div className="relative">
      {startIcon && (
        <span className="pointer-events-none absolute inset-y-0 start-0 flex w-10 items-center justify-center text-fg-subtle [&_svg]:size-[18px]">
          {startIcon}
        </span>
      )}
      {input}
      {endSlot && <span className="absolute inset-y-0 end-0 flex items-center pe-1">{endSlot}</span>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(fieldBase, 'min-h-24 resize-y px-3.5 py-2.5', className)} {...props} />
})

// Native select: best keyboard, screen-reader and mobile behaviour for free.
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, 'h-11 appearance-none ps-3.5 pe-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  )
})
