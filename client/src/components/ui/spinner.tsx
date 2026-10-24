import { cn } from '../../lib/utils'

interface SpinnerProps {
  size?: number
  /** Defaults to the current text colour. */
  color?: string
  className?: string
  label?: string
}

export function Spinner({ size = 20, color, className, label }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('shrink-0 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]', className)}
      style={color ? { color } : undefined}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
