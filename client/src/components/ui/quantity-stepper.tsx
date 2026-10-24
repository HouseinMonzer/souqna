import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  label?: string
  className?: string
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md', disabled, label, className }: QuantityStepperProps) {
  const { t } = useTranslation()
  const id = useId()
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.trunc(n)))
  const button = cn(
    'inline-flex items-center justify-center text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg disabled:pointer-events-none disabled:opacity-35',
    size === 'sm' ? 'size-8' : 'size-11',
  )

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className={cn('inline-flex w-fit items-center overflow-hidden rounded-md border border-border-strong bg-surface', disabled && 'opacity-60', className)}
    >
      <span id={`${id}-label`} className="sr-only">{label ?? t('ui.quantity')}</span>
      <button type="button" className={button} onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} aria-label={t('ui.decrease')}>
        <Minus aria-hidden className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label ?? t('ui.quantity')}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={event => {
          const next = Number(event.target.value)
          if (!Number.isNaN(next) && event.target.value !== '') onChange(clamp(next))
        }}
        className={cn(
          'w-12 border-x border-border bg-transparent text-center font-semibold tabular-nums text-fg outline-none',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          size === 'sm' ? 'h-8 text-sm' : 'h-11 text-base',
        )}
      />
      <button type="button" className={button} onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} aria-label={t('ui.increase')}>
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  )
}
