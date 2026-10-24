import { useId, useState, type KeyboardEvent } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, isRtlElement } from '../../lib/utils'

export interface RatingProps {
  value: number
  size?: number
  /** Show "4.6 (128 reviews)" next to the stars. */
  count?: number
  showValue?: boolean
  className?: string
}

function StarIcon({ fill, size }: { fill: number; size: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <Star aria-hidden className="absolute inset-0 text-border-strong" style={{ width: size, height: size }} strokeWidth={1.5} />
      {fill > 0 && (
        // Partial stars clip from the reading start, so they fill right-to-left in Arabic.
        <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <Star aria-hidden className="fill-star text-star" style={{ width: size, height: size }} strokeWidth={1.5} />
        </span>
      )}
    </span>
  )
}

/** Read-only star rating with half-star precision. */
export function Rating({ value, size = 16, count, showValue, className }: RatingProps) {
  const { t, i18n } = useTranslation()
  const clamped = Math.max(0, Math.min(5, value))
  const rounded = Math.round(clamped * 2) / 2
  const display = clamped.toLocaleString(i18n.language, { maximumFractionDigits: 1, minimumFractionDigits: 1, numberingSystem: 'latn' })
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span role="img" aria-label={t('ui.ratingValue', { value: display })} className="inline-flex gap-0.5">
        {[0, 1, 2, 3, 4].map(i => <StarIcon key={i} size={size} fill={Math.max(0, Math.min(1, rounded - i))} />)}
      </span>
      {showValue && <span className="text-sm font-semibold text-fg">{display}</span>}
      {count !== undefined && <span className="text-sm text-fg-muted">({t('ui.reviews', { count })})</span>}
    </span>
  )
}

/** @deprecated use <Rating /> */
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return <Rating value={rating} size={size} />
}

export interface RatingInputProps {
  value: number
  onChange: (value: number) => void
  size?: number
  label?: string
  disabled?: boolean
  className?: string
}

/** Star picker for reviews. Behaves as a radio group: arrow keys move, Space/Enter select. */
export function RatingInput({ value, onChange, size = 28, label, disabled, className }: RatingInputProps) {
  const { t } = useTranslation()
  const name = useId()
  const [hover, setHover] = useState(0)
  const shown = hover || value

  const onKeyDown = (event: KeyboardEvent) => {
    const rtl = isRtlElement(event.currentTarget)
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward || event.key === 'ArrowUp') onChange(Math.min(5, value + 1))
    else if (event.key === back || event.key === 'ArrowDown') onChange(Math.max(1, value - 1))
    else return
    event.preventDefault()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label ?? t('ui.ratingInput')}
      aria-disabled={disabled || undefined}
      className={cn('inline-flex gap-1', disabled && 'pointer-events-none opacity-50', className)}
      onMouseLeave={() => setHover(0)}
      onKeyDown={onKeyDown}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          role="radio"
          name={name}
          aria-checked={value === star}
          aria-label={t('ui.stars', { count: star })}
          tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          className="rounded-sm p-0.5 transition-transform duration-(--duration-fast) hover:scale-110"
        >
          <Star
            aria-hidden
            style={{ width: size, height: size }}
            strokeWidth={1.5}
            className={star <= shown ? 'fill-star text-star' : 'text-border-strong'}
          />
        </button>
      ))}
    </div>
  )
}
