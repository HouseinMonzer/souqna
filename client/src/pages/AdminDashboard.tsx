import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleDollarSign, Clock, Search, ShoppingCart, Store, Users } from 'lucide-react'
import {
  Avatar, Badge, Button, DataTable, Dialog, DialogClose, DialogContent, DialogFooter, FormField, Input, Pagination, Select, Skeleton,
  Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, formatPrice, toast, type Column,
} from '../components/ui'
import { Container } from '../components/layout/Container'
import { ErrorState } from '../components/commerce/ErrorState'
import {
  adminApi, type AdminSubscription, type AdminUser, type AuditLog, type Order, type Product, type SiteSettings, type Vendor,
} from '../api/admin'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { safeExternalUrl } from '../lib/utils'
import type { OrderStatus } from '../types/database.types'

const TABS = ['overview', 'vendors', 'products', 'orders', 'subscriptions', 'users', 'audit', 'settings'] as const
const LIMIT = 20
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  active: 'success', pending: 'warning', pending_payment: 'warning', suspended: 'danger', rejected: 'neutral',
  draft: 'neutral', inactive: 'warning', deleted: 'neutral', expired: 'neutral', cancelled: 'neutral',
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const key = status.toLowerCase()
  return <Badge tone={STATUS_TONE[key] ?? 'neutral'}>{t(`admin.status_${key}`, { defaultValue: status })}</Badge>
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Search box + status filter + table + pagination, shared by every admin list. */
function AdminList<T>({ load, columns, rowKey, filterOptions, filterLabel }: {
  load: (query: { search: string; filter: string; page: number }) => Promise<{ rows: T[]; total: number }>
  columns: Column<T>[]
  rowKey: (row: T) => string
  filterOptions?: { value: string; label: string }[]
  filterLabel?: string
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search)
  useEffect(() => setPage(1), [debounced, filter])
  const { data, loading, error, reload } = useAsync(() => load({ search: debounced, filter, page }), [debounced, filter, page])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('admin.search')} aria-label={t('admin.search')} startIcon={<Search />} className="sm:w-72" />
        {filterOptions && (
          <Select value={filter} onChange={e => setFilter(e.target.value)} aria-label={filterLabel} className="w-auto">
            <option value="">{filterLabel}</option>
            {filterOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        )}
      </div>
      {error ? <ErrorState onRetry={reload} /> : (
        <DataTable columns={columns} data={data?.rows ?? []} rowKey={rowKey} loading={loading} />
      )}
      {data && <Pagination page={page} total={data.total} limit={LIMIT} onPageChange={setPage} />}
    </div>
  )
}

interface PendingAction { title: string; run: (note: string) => Promise<unknown>; danger?: boolean; withNote?: boolean; label: string }

function ConfirmDialog({ action, onClose }: { action: PendingAction | null; onClose: (done: boolean) => void }) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setNote(''), [action])
  const run = async () => {
    if (!action) return
    setBusy(true)
    try {
      await action.run(note)
      toast({ title: t('admin.updated'), tone: 'success' })
      onClose(true)
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : t('common.loadError'), tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={action !== null} onOpenChange={open => !open && onClose(false)}>
      <DialogContent size="sm" title={action?.title ?? ''}>
        {action?.withNote && <FormField label={t('admin.reason')}><Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={1000} /></FormField>}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t('common.cancel')}</Button></DialogClose>
          <Button variant={action?.danger ? 'danger' : 'primary'} loading={busy} onClick={run}>{action?.label}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Wraps a list with a confirm dialog and a way to refresh it after an action. */
function useListActions() {
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [key, setKey] = useState(0)
  const dialog = <ConfirmDialog action={pending} onClose={done => { setPending(null); if (done) setKey(k => k + 1) }} />
  return { ask: setPending, dialog, key, refresh: () => setKey(k => k + 1) }
}

// ─── Overview ────────────────────────────────────────────────────────────────

function Overview() {
  const { t, i18n } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getAnalytics(), [])
  if (loading) return <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
  if (error || !data) return <ErrorState onRetry={reload} />
  const month = new Intl.DateTimeFormat(i18n.language, { month: 'short' })
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })
  const maxRevenue = Math.max(1, ...data.revenueByMonth.map(m => m.revenue))
  const maxOrders = Math.max(1, ...data.ordersLast7Days.map(d => d.count))
  const kpis: { icon: typeof Store; label: string; value: string; tone?: string }[] = [
    { icon: CircleDollarSign, label: t('admin.kpiRevenue'), value: formatPrice(data.totalRevenue) },
    { icon: ShoppingCart, label: t('admin.kpiOrders'), value: String(data.totalOrders) },
    { icon: Store, label: t('admin.kpiVendors'), value: String(data.totalVendors) },
    { icon: Clock, label: t('admin.kpiPendingVendors'), value: String(data.pendingVendors), tone: data.pendingVendors ? 'bg-warning-soft text-warning' : undefined },
    { icon: Users, label: t('admin.kpiCustomers'), value: String(data.totalCustomers) },
  ]
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone ?? 'bg-primary-soft text-primary-soft-fg'}`}><Icon aria-hidden className="size-5" /></span>
            <div className="grid min-w-0"><span className="truncate text-xs text-fg-muted">{label}</span><bdi className="text-xl font-semibold tabular-nums">{value}</bdi></div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="grid gap-4 rounded-lg border border-border bg-surface p-5">
          <h2 className="font-sans text-base font-semibold">{t('admin.revenueByMonth')}</h2>
          <div className="flex h-44 items-end gap-3" role="img" aria-label={t('admin.revenueByMonth')}>
            {data.revenueByMonth.map(m => (
              <div key={`${m.year}-${m.month}`} className="grid h-full flex-1 grid-rows-[1fr_auto] gap-1.5 text-center">
                <div className="flex items-end"><div className="w-full rounded-t-sm bg-primary/80" style={{ height: `${Math.max(m.revenue ? 3 : 0, (m.revenue / maxRevenue) * 100)}%` }} title={formatPrice(m.revenue)} /></div>
                <span className="text-[11px] text-fg-subtle">{month.format(new Date(m.year, m.month - 1, 1))}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-4 rounded-lg border border-border bg-surface p-5">
          <h2 className="font-sans text-base font-semibold">{t('admin.ordersWeek')}</h2>
          <div className="flex h-44 items-end gap-2" role="img" aria-label={t('admin.ordersWeek')}>
            {data.ordersLast7Days.map((d, i) => (
              <div key={i} className="grid h-full flex-1 grid-rows-[auto_1fr_auto] gap-1.5 text-center">
                <span className="text-[11px] font-medium tabular-nums text-fg-muted">{d.count || ''}</span>
                <div className="flex items-end"><div className="w-full rounded-t-sm bg-accent/80" style={{ height: `${Math.max(d.count ? 3 : 0, (d.count / maxOrders) * 100)}%` }} title={String(d.count)} /></div>
                <span className="text-[11px] text-fg-subtle">{weekday.format(new Date(Date.parse(data.generatedAt) - (6 - i) * 86_400_000))}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      {!!data.topVendors.length && (
        <section className="grid gap-3 rounded-lg border border-border bg-surface p-5">
          <h2 className="font-sans text-base font-semibold">{t('admin.topVendors')}</h2>
          <ul className="divide-y divide-border">
            {data.topVendors.map(v => (
              <li key={v.id} className="flex items-center gap-3 py-2.5 text-sm">
                <Avatar name={v.storeName} size="sm" shape="square" />
                <span className="min-w-0 flex-1 truncate font-medium">{v.storeName}</span>
                <span className="text-fg-muted">{t('admin.vendorStats', { products: v.productCount, orders: v.orderCount })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// ─── Lists ───────────────────────────────────────────────────────────────────

function VendorsList() {
  const { t, i18n } = useTranslation()
  const { ask, dialog, key } = useListActions()
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })
  const act = (vendor: Vendor, status: string, label: string, danger = false) => ask({
    title: t('admin.confirmAction', { action: label, name: vendor.storeName }), label, danger, withNote: status !== 'active',
    run: note => adminApi.updateVendorStatus(vendor.id, status, note),
  })
  const columns: Column<Vendor>[] = [
    { key: 'shop', header: t('admin.colShop'), cell: v => <span className="flex items-center gap-2.5"><Avatar name={v.storeName} src={v.logoUrl} size="sm" shape="square" /><span className="font-medium">{v.storeName}</span></span> },
    { key: 'owner', header: t('admin.colOwner'), cell: v => <span className="grid"><span>{v.ownerName ?? '—'}</span><span className="text-xs text-fg-subtle" dir="ltr">{v.user.email}</span></span> },
    { key: 'products', header: t('admin.colProducts'), align: 'end', cell: v => <span className="tabular-nums">{v._count.products}</span> },
    { key: 'status', header: t('admin.colStatus'), cell: v => <StatusBadge status={v.status} /> },
    { key: 'joined', header: t('admin.colJoined'), cell: v => (v.joinedAt ? date.format(new Date(v.joinedAt)) : '—') },
    {
      key: 'actions', header: <span className="sr-only">{t('dash.colActions')}</span>, align: 'end', cell: v => {
        const s = v.status.toLowerCase()
        return (
          <span className="inline-flex gap-1.5">
            {s === 'pending' && <><Button size="sm" onClick={() => act(v, 'active', t('admin.approve'))}>{t('admin.approve')}</Button><Button size="sm" variant="ghost" onClick={() => act(v, 'rejected', t('admin.reject'), true)}>{t('admin.reject')}</Button></>}
            {s === 'active' && <Button size="sm" variant="ghost" className="text-danger" onClick={() => act(v, 'suspended', t('admin.suspend'), true)}>{t('admin.suspend')}</Button>}
            {(s === 'suspended' || s === 'rejected') && <Button size="sm" variant="outline" onClick={() => act(v, 'active', t('admin.reactivate'))}>{t('admin.reactivate')}</Button>}
          </span>
        )
      },
    },
  ]
  return (
    <>
      <AdminList<Vendor>
        key={key}
        load={async q => { const r = await adminApi.getVendors({ search: q.search, status: q.filter, page: q.page, limit: LIMIT }); return { rows: r.vendors, total: r.total } }}
        columns={columns}
        rowKey={v => v.id}
        filterLabel={t('admin.allStatuses')}
        filterOptions={['pending', 'active', 'suspended', 'rejected'].map(s => ({ value: s, label: t(`admin.status_${s}`) }))}
      />
      {dialog}
    </>
  )
}

function ProductsList() {
  const { t } = useTranslation()
  const { ask, dialog, key } = useListActions()
  const columns: Column<Product>[] = [
    { key: 'name', header: t('admin.colName'), cell: p => <span className="flex items-center gap-2.5"><span className="size-9 shrink-0 overflow-hidden rounded-md bg-surface-muted">{p.image && <img src={p.image} alt="" className="size-full object-cover" />}</span><span className="max-w-60 truncate font-medium">{p.name}</span></span> },
    { key: 'vendor', header: t('admin.colVendor'), cell: p => p.vendor.storeName },
    { key: 'price', header: t('admin.colPrice'), align: 'end', cell: p => <bdi className="tabular-nums">{formatPrice(p.price)}</bdi> },
    { key: 'stock', header: t('admin.colStock'), align: 'end', cell: p => <span className="tabular-nums">{p.stock}</span> },
    { key: 'sold', header: t('admin.colSold'), align: 'end', cell: p => <span className="tabular-nums">{p.totalSold}</span> },
    { key: 'status', header: t('admin.colStatus'), cell: p => <StatusBadge status={p.status} /> },
    {
      key: 'actions', header: <span className="sr-only">{t('dash.colActions')}</span>, align: 'end', cell: p => p.status === 'ACTIVE'
        ? <Button size="sm" variant="ghost" className="text-danger" onClick={() => ask({ title: t('admin.confirmAction', { action: t('admin.suspend'), name: p.name }), label: t('admin.suspend'), danger: true, run: () => adminApi.updateProductStatus(p.id, 'suspended') })}>{t('admin.suspend')}</Button>
        : p.status === 'INACTIVE'
          ? <Button size="sm" variant="outline" onClick={() => ask({ title: t('admin.confirmAction', { action: t('admin.unsuspend'), name: p.name }), label: t('admin.unsuspend'), run: () => adminApi.updateProductStatus(p.id, 'unsuspended') })}>{t('admin.unsuspend')}</Button>
          : null,
    },
  ]
  return (
    <>
      <AdminList<Product>
        key={key}
        load={async q => { const r = await adminApi.getProducts({ search: q.search, status: q.filter, page: q.page, limit: LIMIT }); return { rows: r.products, total: r.total } }}
        columns={columns}
        rowKey={p => p.id}
        filterLabel={t('admin.allStatuses')}
        filterOptions={['active', 'draft', 'inactive', 'suspended'].map(s => ({ value: s, label: t(`admin.status_${s}`) }))}
      />
      {dialog}
    </>
  )
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

function OrdersList() {
  const { t, i18n } = useTranslation()
  const { refresh, key } = useListActions()
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })
  const change = async (order: Order, status: string) => {
    try {
      await adminApi.updateOrderStatus(order.id, status)
      toast({ title: t('admin.updated'), tone: 'success' })
      refresh()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : t('common.loadError'), tone: 'danger' })
    }
  }
  const columns: Column<Order>[] = [
    { key: 'order', header: t('admin.colOrder'), cell: o => <bdi className="font-mono text-xs">{o.orderNumber}</bdi> },
    { key: 'customer', header: t('admin.colCustomer'), cell: o => o.user.name },
    { key: 'vendor', header: t('admin.colVendor'), cell: o => o.vendor.storeName },
    { key: 'total', header: t('admin.colTotal'), align: 'end', cell: o => <bdi className="tabular-nums">{formatPrice(o.total)}</bdi> },
    { key: 'date', header: t('admin.colDate'), cell: o => date.format(new Date(o.createdAt)) },
    {
      key: 'status', header: t('admin.colStatus'), cell: o => (
        <Select value={o.status.toLowerCase()} onChange={e => change(o, e.target.value)} aria-label={`${t('admin.colStatus')}: ${o.orderNumber}`} className="h-9 w-40 text-sm">
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </Select>
      ),
    },
  ]
  return (
    <AdminList<Order>
      key={key}
      load={async q => { const r = await adminApi.getOrders({ search: q.search, status: q.filter, page: q.page, limit: LIMIT }); return { rows: r.orders, total: r.total } }}
      columns={columns}
      rowKey={o => o.id}
      filterLabel={t('admin.allStatuses')}
      filterOptions={ORDER_STATUSES.map(s => ({ value: s, label: t(`status.${s}`) }))}
    />
  )
}

function SubscriptionsList() {
  const { t, i18n } = useTranslation()
  const { ask, dialog, key } = useListActions()
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })
  const act = (sub: AdminSubscription, status: string, label: string, danger = false) => ask({
    title: t('admin.confirmAction', { action: label, name: sub.vendor?.store_name ?? '' }), label, danger, withNote: status !== 'active',
    run: note => adminApi.updateSubscriptionStatus(sub.id, status, note || undefined),
  })
  const methodLabel: Record<string, string> = { wish_money: 'sub.wish', omt: 'sub.omt', cash_delivery: 'sub.cash', credit_card: 'checkout.creditCard' }
  const columns: Column<AdminSubscription>[] = [
    { key: 'shop', header: t('admin.colShop'), cell: s => s.vendor?.store_name ?? '—' },
    { key: 'plan', header: t('admin.colPlan'), cell: s => t(`sub.${s.plan}`) },
    { key: 'amount', header: t('admin.colAmount'), align: 'end', cell: s => <bdi className="tabular-nums">{formatPrice(s.amount)}</bdi> },
    { key: 'method', header: t('admin.colMethod'), cell: s => (s.payment_method ? t(methodLabel[s.payment_method] ?? s.payment_method) : '—') },
    {
      key: 'proof', header: t('admin.colProof'), cell: s => {
        const href = safeExternalUrl(s.payment_proof)
        return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{t('admin.viewProof')}</a> : <span className="text-fg-subtle">{t('admin.none')}</span>
      },
    },
    { key: 'status', header: t('admin.colStatus'), cell: s => <StatusBadge status={s.status} /> },
    { key: 'ends', header: t('admin.colEnds'), cell: s => (s.end_date ? date.format(new Date(s.end_date)) : '—') },
    {
      key: 'actions', header: <span className="sr-only">{t('dash.colActions')}</span>, align: 'end', cell: s => (
        <span className="inline-flex gap-1.5">
          {s.status === 'pending_payment' && <><Button size="sm" onClick={() => act(s, 'active', t('admin.approve'))}>{t('admin.approve')}</Button><Button size="sm" variant="ghost" onClick={() => act(s, 'cancelled', t('admin.cancel'), true)}>{t('admin.cancel')}</Button></>}
          {s.status === 'active' && <Button size="sm" variant="ghost" className="text-danger" onClick={() => act(s, 'expired', t('admin.expire'), true)}>{t('admin.expire')}</Button>}
        </span>
      ),
    },
  ]
  return (
    <>
      <AdminList<AdminSubscription>
        key={key}
        load={async q => {
          const rows = await adminApi.getSubscriptions({ status: q.filter })
          const filtered = q.search ? rows.filter(r => r.vendor?.store_name.toLowerCase().includes(q.search.toLowerCase())) : rows
          return { rows: filtered.slice((q.page - 1) * LIMIT, q.page * LIMIT), total: filtered.length }
        }}
        columns={columns}
        rowKey={s => s.id}
        filterLabel={t('admin.allStatuses')}
        filterOptions={['pending_payment', 'active', 'expired', 'cancelled'].map(s => ({ value: s, label: t(`admin.status_${s}`) }))}
      />
      {dialog}
    </>
  )
}

function UsersList() {
  const { t, i18n } = useTranslation()
  const { refresh, key } = useListActions()
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })
  const change = async (user: AdminUser, role: AdminUser['role']) => {
    try {
      await adminApi.updateUserRole(user.id, role)
      toast({ title: t('admin.updated'), tone: 'success' })
      refresh()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : t('common.loadError'), tone: 'danger' })
      refresh()
    }
  }
  const columns: Column<AdminUser>[] = [
    { key: 'name', header: t('admin.colName'), cell: u => <span className="flex items-center gap-2.5"><Avatar name={u.fullName || u.email} size="sm" /><span className="font-medium">{u.fullName || '—'}</span></span> },
    { key: 'email', header: t('admin.colEmail'), cell: u => <span dir="ltr">{u.email}</span> },
    { key: 'shop', header: t('admin.colShop'), cell: u => u.storeName ?? '—' },
    { key: 'joined', header: t('admin.colJoined'), cell: u => date.format(new Date(u.createdAt)) },
    {
      key: 'role', header: t('admin.colRole'), cell: u => (
        <Select value={u.role} onChange={e => change(u, e.target.value as AdminUser['role'])} aria-label={`${t('admin.colRole')}: ${u.email}`} className="h-9 w-32 text-sm">
          {(['customer', 'vendor', 'admin'] as const).map(r => <option key={r} value={r}>{t(`admin.role_${r}`)}</option>)}
        </Select>
      ),
    },
  ]
  return (
    <AdminList<AdminUser>
      key={key}
      load={async q => { const r = await adminApi.getUsers({ search: q.search, role: q.filter, page: q.page, limit: LIMIT }); return { rows: r.users, total: r.total } }}
      columns={columns}
      rowKey={u => u.id}
      filterLabel={t('admin.allRoles')}
      filterOptions={(['customer', 'vendor', 'admin'] as const).map(r => ({ value: r, label: t(`admin.role_${r}`) }))}
    />
  )
}

function AuditList() {
  const { t, i18n } = useTranslation()
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })
  const columns: Column<AuditLog>[] = [
    { key: 'date', header: t('admin.colDate'), cell: l => <span className="whitespace-nowrap">{date.format(new Date(l.createdAt))}</span> },
    { key: 'action', header: t('admin.colAction'), cell: l => <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{l.action}</code> },
    { key: 'target', header: t('admin.colTarget'), cell: l => <span className="grid"><span>{l.targetName}</span><span className="text-xs text-fg-subtle">{l.targetType}</span></span> },
    { key: 'actor', header: t('admin.colActor'), cell: l => <span className="font-mono text-xs text-fg-muted">{l.actorId.slice(0, 10)}</span> },
  ]
  return (
    <AdminList<AuditLog>
      load={async q => { const r = await adminApi.getAuditLogs({ targetType: q.search || undefined, page: q.page, limit: LIMIT }); return { rows: r.logs, total: r.total } }}
      columns={columns}
      rowKey={l => l.id}
    />
  )
}

function SettingsForm() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getSettings(), [])
  const [form, setForm] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (data) setForm(data) }, [data])
  if (loading || !form) return error ? <ErrorState onRetry={reload} /> : <Skeleton className="h-64 rounded-lg" />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await adminApi.updateSettings({
        siteName: form.siteName, currency: form.currency, commissionRate: Number(form.commissionRate),
        autoApproveVendors: form.autoApproveVendors, maintenanceMode: form.maintenanceMode,
      })
      toast({ title: t('admin.saved'), tone: 'success' })
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : t('common.loadError'), tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-5 rounded-lg border border-border bg-surface p-5">
      <FormField label={t('admin.siteName')}><Input value={form.siteName} onChange={e => setForm({ ...form, siteName: e.target.value })} /></FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('admin.currency')}><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} dir="ltr" /></FormField>
        <FormField label={t('admin.commission')}><Input type="number" min={0} max={100} step="0.5" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} dir="ltr" /></FormField>
      </div>
      <Switch label={t('admin.autoApprove')} description={t('admin.autoApproveText')} checked={form.autoApproveVendors} onCheckedChange={v => setForm({ ...form, autoApproveVendors: v })} />
      <Switch label={t('admin.maintenance')} description={t('admin.maintenanceText')} checked={form.maintenanceMode} onCheckedChange={v => setForm({ ...form, maintenanceMode: v })} />
      <Button type="submit" className="w-fit" loading={saving}>{t('admin.saveSettings')}</Button>
    </form>
  )
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  usePageTitle(t('admin.title'))
  const [params, setParams] = useSearchParams()
  const tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? params.get('tab')! : 'overview'
  const panels: Record<string, ReactNode> = {
    overview: <Overview />, vendors: <VendorsList />, products: <ProductsList />, orders: <OrdersList />,
    subscriptions: <SubscriptionsList />, users: <UsersList />, audit: <AuditList />, settings: <SettingsForm />,
  }
  return (
    <Container className="grid gap-6 py-6 sm:py-8">
      <h1 className="text-3xl font-semibold">{t('admin.title')}</h1>
      <Tabs value={tab} onValueChange={value => setParams(value === 'overview' ? {} : { tab: value }, { replace: true })}>
        <TabsList>
          {TABS.map(id => <TabsTrigger key={id} value={id}>{t(`admin.${id}`)}</TabsTrigger>)}
        </TabsList>
        {/* Only the active tab mounts, so each list loads when opened. */}
        <TabsContent value={tab}>{panels[tab]}</TabsContent>
      </Tabs>
    </Container>
  )
}
