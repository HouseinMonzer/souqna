import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'

export interface EmptyStateProps {
  title: string
  /** An icon element, or a string (emoji) for legacy callers. */
  icon?: ReactNode
  message?: ReactNode
  action?: (() => void) | ReactNode
  actionLabel?: string
  className?: string
}

export function EmptyState({ title, icon, message, action, actionLabel, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}>
      {icon && (
        <div className="mb-1 flex size-16 items-center justify-center rounded-full bg-surface-muted text-3xl text-fg-subtle [&_svg]:size-7" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-fg">{title}</h3>
      {message && <p className="max-w-sm text-sm text-fg-muted">{message}</p>}
      {typeof action === 'function'
        ? actionLabel && <Button className="mt-2" onClick={action}>{actionLabel}</Button>
        : action && <div className="mt-2">{action}</div>}
    </div>
  )
}
