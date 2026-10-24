import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { Badge } from './badge'

export interface PriceTagProps {
  price: number
  comparePrice?: number | null
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  showDiscount?: boolean
  className?: string
}

// Prices in Lebanon are written "$1,250.50" in both Arabic and English, so the
// format does not follow the UI language. Render inside <bdi> in RTL text.
export function formatPrice(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    numberingSystem: 'latn',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const SIZES = { sm: 'text-sm', md: 'text-lg', lg: 'text-3xl' }

export function PriceTag({ price, comparePrice, currency = 'USD', size = 'md', showDiscount = true, className }: PriceTagProps) {
  const { t } = useTranslation()
  const onSale = comparePrice != null && comparePrice > price
  const percent = onSale ? Math.round((1 - price / comparePrice) * 100) : 0

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className={cn('font-bold tabular-nums text-fg', SIZES[size], onSale && 'text-accent')}><bdi>{formatPrice(price, currency)}</bdi></span>
      {onSale && (
        <>
          <s aria-hidden className="text-sm tabular-nums text-fg-subtle"><bdi>{formatPrice(comparePrice, currency)}</bdi></s>
          <span className="sr-only">{t('ui.wasPrice', { price: formatPrice(comparePrice, currency) })}</span>
          {showDiscount && percent > 0 && <Badge tone="accent" size="sm">{t('ui.off', { percent })}</Badge>}
        </>
      )}
    </span>
  )
}
