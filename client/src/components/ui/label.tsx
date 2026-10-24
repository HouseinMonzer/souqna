import { forwardRef, type LabelHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required, children, ...props },
  ref,
) {
  return (
    <label ref={ref} className={cn('text-sm font-medium text-fg', className)} {...props}>
      {children}
      {required && <span aria-hidden className="ms-0.5 text-danger">*</span>}
    </label>
  )
})
