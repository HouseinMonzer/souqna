import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export interface PaginationProps {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  className?: string
}

/** Page numbers to show, with null marking a gap: 1 … 4 5 6 … 20 */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach(p => pages.add(p))
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach(p => pages.add(p))
  const sorted = [...pages].filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]))
}

const itemClass = 'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors duration-(--duration-fast)'

export function Pagination({ page, total, limit, onPageChange, className }: PaginationProps) {
  const { t } = useTranslation()
  const pageCount = Math.max(1, Math.ceil(total / limit))
  if (pageCount <= 1) return null

  return (
    <nav aria-label={t('ui.pagination')} className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        className={cn(itemClass, 'gap-1 text-fg-muted hover:bg-surface-muted hover:text-fg disabled:pointer-events-none disabled:opacity-40')}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('ui.previous')}
      >
        <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
      </button>
      {/* Phones get a compact "Page 5 of 20"; the full list needs ~390px. */}
      <span className="px-3 text-sm font-medium tabular-nums text-fg sm:hidden" aria-live="polite">
        {t('ui.pageOf', { page, count: pageCount })}
      </span>
      {pageWindow(page, pageCount).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} aria-hidden className={cn(itemClass, 'hidden text-fg-subtle sm:inline-flex')}>…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={t('ui.page', { page: p })}
            aria-current={p === page ? 'page' : undefined}
            className={cn(itemClass, 'hidden sm:inline-flex', p === page ? 'bg-primary text-primary-fg' : 'text-fg hover:bg-surface-muted')}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={cn(itemClass, 'gap-1 text-fg-muted hover:bg-surface-muted hover:text-fg disabled:pointer-events-none disabled:opacity-40')}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={t('ui.next')}
      >
        <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  )
}
