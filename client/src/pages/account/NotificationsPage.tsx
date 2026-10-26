import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCheck, Package, Store, Wallet } from 'lucide-react'
import { Button, EmptyState, Pagination, Skeleton } from '../../components/ui'
import { ErrorState } from '../../components/commerce/ErrorState'
import { notifications as api, type AppNotification } from '../../api/account'
import { useAsync } from '../../hooks/useAsync'
import { usePageTitle } from '../../hooks/usePageTitle'
import { cn } from '../../lib/utils'

const ICONS: Record<string, typeof Bell> = { order: Package, vendor: Store, subscription: Wallet }
const iconFor = (type: string) => ICONS[type.split('.')[0]] ?? Bell

export default function NotificationsPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('account.notifications'))
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  // The reference time is captured with the data so relative times stay stable between renders.
  const { data, loading, error, reload } = useAsync(signal => api.list(page, signal).then(r => ({ ...r, now: Date.now() })), [page])
  const time = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })

  const ago = (iso: string, now: number) => {
    const minutes = Math.round((new Date(iso).getTime() - now) / 60000)
    if (Math.abs(minutes) < 60) return time.format(minutes, 'minute')
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) return time.format(hours, 'hour')
    return time.format(Math.round(hours / 24), 'day')
  }

  const open = async (note: AppNotification) => {
    if (!note.read_at) await api.read(note.id).catch(() => {})
    // Only follow in-app links.
    if (note.link?.startsWith('/')) navigate(note.link)
    else reload()
  }

  const readAll = async () => {
    await api.readAll()
    reload()
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold">{t('account.notifications')}</h1>
          {!!data?.unread && <p className="text-sm text-fg-muted">{t('account.unread', { count: data.unread })}</p>}
        </div>
        {!!data?.unread && <Button variant="outline" size="sm" startIcon={<CheckCheck />} onClick={readAll}>{t('account.markAllRead')}</Button>}
      </div>
      {error ? <ErrorState onRetry={reload} /> : loading ? (
        <div className="grid gap-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState icon={<Bell />} title={t('account.noNotifications')} message={t('account.noNotificationsText')} />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {data.data.map(note => {
              const Icon = iconFor(note.type)
              return (
                <li key={note.id}>
                  <button type="button" onClick={() => open(note)} className={cn('flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors hover:bg-surface-muted', !note.read_at && 'bg-primary-soft/40')}>
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted"><Icon aria-hidden className="size-4" /></span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className={cn('text-sm', !note.read_at && 'font-semibold')}>{note.title}</span>
                      {note.body && <span className="text-sm text-fg-muted">{note.body}</span>}
                      <span className="text-xs text-fg-subtle">{ago(note.created_at, data.now)}</span>
                    </span>
                    {!note.read_at && <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-accent" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
