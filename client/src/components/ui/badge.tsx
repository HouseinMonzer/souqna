import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap [&_svg]:size-3', {
  variants: {
    tone: { neutral: '', brand: '', accent: '', success: '', warning: '', danger: '', info: '' },
    appearance: { soft: '', solid: '', outline: 'border bg-transparent' },
    size: { sm: 'px-2 py-0.5 text-[11px]', md: 'px-2.5 py-1 text-xs' },
  },
  compoundVariants: [
    { appearance: 'soft', tone: 'neutral', class: 'bg-surface-sunken text-fg-muted' },
    { appearance: 'soft', tone: 'brand', class: 'bg-primary-soft text-primary-soft-fg' },
    { appearance: 'soft', tone: 'accent', class: 'bg-accent-soft text-accent-soft-fg' },
    { appearance: 'soft', tone: 'success', class: 'bg-success-soft text-success' },
    { appearance: 'soft', tone: 'warning', class: 'bg-warning-soft text-warning' },
    { appearance: 'soft', tone: 'danger', class: 'bg-danger-soft text-danger' },
    { appearance: 'soft', tone: 'info', class: 'bg-info-soft text-info' },
    { appearance: 'solid', tone: 'neutral', class: 'bg-fg text-bg' },
    { appearance: 'solid', tone: 'brand', class: 'bg-primary text-primary-fg' },
    { appearance: 'solid', tone: 'accent', class: 'bg-accent text-accent-fg' },
    { appearance: 'solid', tone: 'success', class: 'bg-success text-white dark:text-sand-950' },
    { appearance: 'solid', tone: 'warning', class: 'bg-warning text-white dark:text-sand-950' },
    { appearance: 'solid', tone: 'danger', class: 'bg-danger text-white dark:text-sand-950' },
    { appearance: 'solid', tone: 'info', class: 'bg-info text-white dark:text-sand-950' },
    { appearance: 'outline', tone: 'neutral', class: 'border-border-strong text-fg-muted' },
    { appearance: 'outline', tone: 'brand', class: 'border-primary text-primary' },
    { appearance: 'outline', tone: 'accent', class: 'border-accent text-accent' },
    { appearance: 'outline', tone: 'success', class: 'border-success text-success' },
    { appearance: 'outline', tone: 'warning', class: 'border-warning text-warning' },
    { appearance: 'outline', tone: 'danger', class: 'border-danger text-danger' },
    { appearance: 'outline', tone: 'info', class: 'border-info text-info' },
  ],
  defaultVariants: { tone: 'neutral', appearance: 'soft', size: 'md' },
})

type LegacyVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue'
const LEGACY_TONES = { green: 'brand', yellow: 'warning', red: 'danger', gray: 'neutral', blue: 'info' } as const

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** @deprecated use `tone` */
  variant?: LegacyVariant
}

export function Badge({ className, tone, appearance, size, variant, ...props }: BadgeProps) {
  const resolvedTone = tone ?? (variant ? LEGACY_TONES[variant] : undefined)
  return <span className={cn(badgeVariants({ tone: resolvedTone, appearance, size }), className)} {...props} />
}
