import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Package } from 'lucide-react'
import { Button, EmptyState, Pagination, Skeleton, formatPrice } from '../../components/ui'
import { OrderStatusBadge } from '../../components/commerce/OrderStatusBadge'
import { ErrorState } from '../../components/commerce/ErrorState'
import { orders } from '../../api/account'
import { useAsync } from '../../hooks/useAsync'
import { usePageTitle } from '../../hooks/usePageTitle'

export default function OrdersPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('account.orders'))
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(signal => orders.mine(page, signal), [page])
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  return (
    <div className="grid gap-5">
      <h1 className="text-3xl font-semibold">{t('account.orders')}</h1>
      {error ? <ErrorState onRetry={reload} /> : loading ? (
        <div className="grid gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState icon={<Package />} title={t('account.noOrders')} message={t('account.noOrdersText')} action={<Button asChild><Link to="/shop">{t('cart.startShopping')}</Link></Button>} />
      ) : (
        <>
          <ul className="grid gap-3">
            {data.data.map(order => {
              const items = order.order_items ?? []
              const count = items.reduce((sum, item) => sum + item.quantity, 0)
              return (
                <li key={order.id}>
                  <Link to={`/account/orders/${order.id}`} className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-sm">
                    <div className="flex -space-x-3 rtl:space-x-reverse">
                      {items.slice(0, 3).map(item => (
                        <span key={item.id} className="size-12 overflow-hidden rounded-md border-2 border-surface bg-surface-muted">
                          {item.product_image && <img src={item.product_image} alt="" className="size-full object-cover" />}
                        </span>
                      ))}
                    </div>
                    <div className="grid min-w-0 flex-1 gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{t('account.orderNumber', { number: '' })}<bdi className="font-mono text-sm">{order.order_number}</bdi></span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <span className="text-sm text-fg-muted">
                        {t('account.placedOn', { date: date.format(new Date(order.created_at)) })} · {t('account.itemsCount', { count })} · <bdi>{formatPrice(order.total)}</bdi>
                      </span>
                    </div>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </Link>
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
