import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('ui.breadcrumb')} className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className={cn('min-w-0', last && 'truncate font-medium text-fg')}>
                {item.to && !last ? (
                  <Link to={item.to} className="rounded-sm transition-colors hover:text-fg hover:underline underline-offset-4">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{item.label}</span>
                )}
              </li>
              {!last && (
                <li aria-hidden className="text-fg-subtle">
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
