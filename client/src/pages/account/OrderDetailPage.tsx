import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, MapPin, PackageX, Wallet, X } from 'lucide-react'
import { Button, EmptyState, Skeleton, formatPrice } from '../../components/ui'
import { OrderStatusBadge } from '../../components/commerce/OrderStatusBadge'
import { ErrorState } from '../../components/commerce/ErrorState'
import { orders } from '../../api/account'
import { ApiError } from '../../lib/api'
import { useAsync } from '../../hooks/useAsync'
import { usePageTitle } from '../../hooks/usePageTitle'
import { cn } from '../../lib/utils'
import type { OrderStatus } from '../../types/database.types'

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

function ProgressTracker({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-fg-subtle text-bg"><X aria-hidden className="size-4" /></span>
        <span className="font-semibold">{t(`status.${status}`)}</span>
      </div>
    )
  }
  const current = STEPS.indexOf(status)
  return (
    <ol aria-label={t('account.timeline')} className="grid grid-cols-5 gap-1">
      {STEPS.map((step, index) => {
        const done = index <= current
        return (
          <li key={step} aria-current={index === current ? 'step' : undefined} className="grid justify-items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', index === 0 ? 'invisible' : done ? 'bg-primary' : 'bg-border')} />
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold', done ? 'bg-primary text-primary-fg' : 'border border-border-strong text-fg-subtle')}>
                {done ? <Check aria-hidden className="size-4" /> : index + 1}
              </span>
              <span className={cn('h-0.5 flex-1', index === STEPS.length - 1 ? 'invisible' : index < current ? 'bg-primary' : 'bg-border')} />
            </div>
            <span className={cn('text-xs font-medium', done ? 'text-fg' : 'text-fg-subtle')}>{t(`status.${step}`)}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function OrderDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const { data: order, loading, error, reload } = useAsync(signal => orders.get(id, signal), [id])
  usePageTitle(order ? t('account.orderNumber', { number: order.order_number }) : t('account.orders'))
  const dateTime = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })

  const back = (
    <Button asChild variant="ghost" size="sm" startIcon={<ArrowLeft className="rtl:rotate-180" />} className="-ms-3 w-fit">
      <Link to="/account/orders">{t('account.backToOrders')}</Link>
    </Button>
  )

  if (loading) return <div className="grid gap-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-24 rounded-lg" /><Skeleton className="h-48 rounded-lg" /></div>
  if (error instanceof ApiError && error.status === 404) return <div className="grid gap-4">{back}<EmptyState icon={<PackageX />} title={t('account.orderNotFound')} /></div>
  if (error || !order) return <ErrorState onRetry={reload} />

  const items = order.order_items ?? []
  const row = (label: string, value: number, strong?: boolean) => (
    <div className={cn('flex justify-between', strong ? 'font-semibold' : 'text-sm text-fg-muted')}><span>{label}</span><bdi className="tabular-nums">{formatPrice(value)}</bdi></div>
  )

  return (
    <div className="grid gap-6">
      {back}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{t('account.orderNumber', { number: '' })}<bdi className="font-mono text-2xl">{order.order_number}</bdi></h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="-mt-3 text-sm text-fg-muted">{t('account.placedOn', { date: dateTime.format(new Date(order.created_at)) })}</p>

      <section className="rounded-lg border border-border bg-surface p-5"><ProgressTracker status={order.status} /></section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="grid content-start gap-3 self-start rounded-lg border border-border bg-surface p-5">
          <h2 className="font-sans text-base font-semibold">{t('account.items')}</h2>
          <ul className="divide-y divide-border">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span className="size-14 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                  {item.product_image && <img src={item.product_image} alt="" className="size-full object-cover" />}
                </span>
                <div className="grid min-w-0 flex-1 gap-1">
                  <span className="line-clamp-2 font-medium">{item.product_name}</span>
                  <span className="text-sm text-fg-muted">{item.variant_info && `${item.variant_info} · `}× {item.quantity}</span>
                  <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={item.vendor_status} />
                    {item.tracking_number && <span className="text-xs text-fg-muted">{t('account.tracking')}: <bdi className="font-mono">{item.tracking_number}</bdi></span>}
                  </div>
                </div>
                <bdi className="tabular-nums">{formatPrice(item.total_price)}</bdi>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid content-start gap-4">
          <section className="grid gap-2 rounded-lg border border-border bg-surface p-5">
            <h2 className="font-sans text-base font-semibold">{t('account.summary')}</h2>
            {row(t('cart.subtotal'), order.subtotal)}
            {row(t('cart.delivery'), order.shipping_cost)}
            <div className="border-t border-border pt-2">{row(t('cart.total'), order.total, true)}</div>
          </section>
          <section className="grid gap-2 rounded-lg border border-border bg-surface p-5 text-sm">
            <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><MapPin aria-hidden className="size-4 text-fg-subtle" />{t('account.shipTo')}</h2>
            <p>{order.shipping_name} · <bdi>{order.shipping_phone}</bdi></p>
            <p className="text-fg-muted">{[order.shipping_address, order.shipping_city].filter(Boolean).join(', ')}</p>
            {order.customer_note && <p className="text-fg-muted"><span className="font-medium text-fg">{t('account.note')}:</span> {order.customer_note}</p>}
          </section>
          <section className="flex items-center gap-2 rounded-lg border border-border bg-surface p-5 text-sm">
            <Wallet aria-hidden className="size-4 text-fg-subtle" />
            <span className="font-semibold">{t('account.payment')}:</span> {t('checkout.cash')}
          </section>
        </div>
      </div>

      {!!order.status_history?.length && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">{t('account.history')}</h2>
          <ol className="grid gap-3 border-s-2 border-border ps-5">
            {[...order.status_history].reverse().map(entry => {
              const item = entry.order_item_id ? items.find(i => i.id === entry.order_item_id) : null
              return (
                <li key={entry.id} className="relative grid gap-0.5">
                  <span aria-hidden className="absolute -start-[1.69rem] top-1.5 size-3 rounded-full border-2 border-surface bg-primary" />
                  <span className="text-sm font-semibold">{t(`status.${entry.status}`)}{item && <span className="font-normal text-fg-muted"> · {item.product_name}</span>}</span>
                  <span className="text-xs text-fg-subtle">{dateTime.format(new Date(entry.created_at))}</span>
                  {entry.note && <span className="text-sm text-fg-muted">{entry.note}</span>}
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}
