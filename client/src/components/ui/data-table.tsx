import type { Key, ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { Skeleton } from './skeleton'
import { EmptyState } from './empty-state'

export interface Column<T> {
  key: string
  header: ReactNode
  cell?: (row: T) => ReactNode
  align?: 'start' | 'center' | 'end'
  sortable?: boolean
  className?: string
}

export interface SortState {
  key: string
  direction: 'asc' | 'desc'
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => Key
  loading?: boolean
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  empty?: ReactNode
  caption?: string
  onRowClick?: (row: T) => void
  className?: string
}

const ALIGN = { start: 'text-start', center: 'text-center', end: 'text-end' }

export function DataTable<T>({
  columns, data, rowKey, loading, sort, onSortChange, empty, caption, onRowClick, className,
}: DataTableProps<T>) {
  const { t } = useTranslation()

  const toggleSort = (key: string) => {
    onSortChange?.({ key, direction: sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc' })
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border bg-surface', className)}>
      <table className="w-full min-w-max border-collapse text-sm" aria-busy={loading || undefined}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="sticky top-0 z-[1] bg-surface-muted">
          <tr>
            {columns.map(column => {
              const active = sort?.key === column.key
              const SortIcon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn('border-b border-border px-4 py-3 font-semibold text-fg-muted', ALIGN[column.align ?? 'start'], column.className)}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1.5 rounded-sm hover:text-fg"
                      aria-label={typeof column.header === 'string' ? t('ui.sortBy', { column: column.header }) : undefined}
                    >
                      {column.header}
                      <SortIcon aria-hidden className={cn('size-3.5', !active && 'opacity-40')} />
                    </button>
                  ) : column.header}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map(column => (
                    <td key={column.key} className="border-b border-border px-4 py-3.5"><Skeleton className="h-4 w-3/4" /></td>
                  ))}
                </tr>
              ))
            : data.map(row => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('transition-colors hover:bg-surface-muted/60 [&:last-child>td]:border-b-0', onRowClick && 'cursor-pointer')}
                >
                  {columns.map(column => (
                    <td key={column.key} className={cn('border-b border-border px-4 py-3.5 text-fg', ALIGN[column.align ?? 'start'], column.className)}>
                      {column.cell ? column.cell(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && data.length === 0 && (empty ?? <EmptyState title={t('ui.noResults')} className="py-12" />)}
    </div>
  )
}
