import { cloneElement, isValidElement, useId, type ReactElement } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Label } from './label'

interface ControlProps {
  id?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}

export interface FormFieldProps {
  label: string
  /** A single form control; it receives id, aria-describedby, aria-invalid and required. */
  children: ReactElement<ControlProps>
  hint?: string
  error?: string
  required?: boolean
  className?: string
}

export function FormField({ label, children, hint, error, required, className }: FormFieldProps) {
  const generated = useId()
  const id = children.props.id ?? generated
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [children.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        required: required ?? children.props.required,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} required={required}>{label}</Label>
      {control}
      {hint && !error && <p id={hintId} className="text-xs text-fg-muted">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertCircle aria-hidden className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
