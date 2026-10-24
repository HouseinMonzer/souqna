import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Spinner } from './spinner'

export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-standard)',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg shadow-sm hover:bg-primary-hover',
        accent: 'bg-accent text-accent-fg shadow-sm hover:bg-accent-hover',
        secondary: 'bg-primary-soft text-primary-soft-fg hover:bg-brand-100 dark:hover:bg-brand-900',
        outline: 'border border-border-strong bg-surface text-fg hover:bg-surface-muted',
        ghost: 'text-fg hover:bg-surface-muted',
        danger: 'bg-danger text-white shadow-sm hover:opacity-90 dark:text-sand-950',
        link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        md: 'h-11 px-5 text-sm [&_svg]:size-[18px]',
        lg: 'h-12 px-7 text-base [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-5',
        'icon-sm': 'size-9 [&_svg]:size-4',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a router Link) with button styles. */
  asChild?: boolean
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, fullWidth, asChild, loading = false, startIcon, endIcon, disabled, children, type, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className)
  if (asChild) {
    return <Slot ref={ref} className={classes} {...props}>{children}</Slot>
  }
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={16} /> : startIcon}
      {children}
      {!loading && endIcon}
    </button>
  )
})

export interface IconButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon' | 'children'> {
  /** Accessible name — required because the button has no visible text. */
  label: string
  icon: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = 'icon', variant = 'ghost', ...props },
  ref,
) {
  return (
    <Button ref={ref} aria-label={label} title={label} size={size} variant={variant} {...props}>
      {icon}
    </Button>
  )
})
