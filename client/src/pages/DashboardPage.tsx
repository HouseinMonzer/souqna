import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, CircleDollarSign, Clock, ExternalLink, EyeOff, ImageOff, Package, Pencil, Plus, ShoppingCart, Star, Store, Trash2,
} from 'lucide-react'
import {
  Badge, Button, DataTable, Dialog, DialogClose, DialogContent, DialogFooter, EmptyState, FormField, IconButton, Input, Select, Skeleton,
  Tabs, TabsContent, TabsList, TabsTrigger, Textarea, formatPrice, toast, type Column,
} from '../components/ui'
import { Container } from '../components/layout/Container'
import { ImageDrop } from '../components/commerce/ImageDrop'
import { OrderStatusBadge } from '../components/commerce/OrderStatusBadge'
import { ErrorState } from '../components/commerce/ErrorState'
import { vendorApi, type ProductInput, type VendorMe, type VendorOrderItem } from '../api/vendor'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'
import type { OrderStatus, Product } from '../types/database.types'

const TABS = ['overview', 'products', 'orders', 'store'] as const
type Tab = (typeof TABS)[number]

// ─── Shop setup (for accounts that are not vendors yet) ──────────────────────

function SetupShop({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation()
  const loadUser = useAuthStore(s => s.loadUser)
  const [form, setForm] = useState({ storeName: '', category: '', location: '', phone: '', description: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.storeName.trim().length < 2) return setError(t('auth.nameShort'))
    setSaving(true)
    setError('')
    try {
      await vendorApi.setup(form)
      await loadUser()
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="grid max-w-xl gap-6 py-10">
      <div className="grid gap-2">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"><Store aria-hidden className="size-6" /></span>
        <h1 className="text-3xl font-semibold">{t('dash.setupTitle')}</h1>
        <p className="text-fg-muted">{t('dash.setupText')}</p>
      </div>
      <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-surface p-5" noValidate>
        <FormField label={t('dash.storeName')} required error={error || undefined}><Input value={form.storeName} onChange={set('storeName')} /></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('dash.storeCategory')}><Input value={form.category} onChange={set('category')} placeholder={t('dash.categoryPlaceholder')} /></FormField>
          <FormField label={t('dash.location')}><Input value={form.location} onChange={set('location')} /></FormField>
        </div>
        <FormField label={t('dash.phone')}><Input value={form.phone} onChange={set('phone')} type="tel" dir="ltr" /></FormField>
        <FormField label={t('dash.storeDescription')}><Textarea value={form.description} onChange={set('description')} rows={3} maxLength={2000} /></FormField>
        <Button type="submit" size="lg" loading={saving}>{t('dash.setupButton')}</Button>
      </form>
    </Container>
  )
}

// ─── Overview ────────────────────────────────────────────────────────────────

function SalesChart({ items }: { items: VendorOrderItem[] }) {
  const { t, i18n } = useTranslation()
  const days = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const buckets = Array.from({ length: 14 }, (_, i) => ({ date: new Date(today.getTime() - (13 - i) * 86400000), total: 0 }))
    for (const item of items) {
      if (item.vendor_status !== 'delivered') continue
      const day = new Date(item.created_at)
      day.setHours(0, 0, 0, 0)
      const bucket = buckets.find(b => b.date.getTime() === day.getTime())
      if (bucket) bucket.total += item.total_price
    }
    return buckets
  }, [items])
  const max = Math.max(...days.map(d => d.total))
  const label = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' })

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-surface p-5">
      <h2 className="font-sans text-base font-semibold">{t('dash.salesChart')}</h2>
      {max === 0 ? <p className="py-8 text-center text-sm text-fg-muted">{t('dash.salesChartEmpty')}</p> : (
        <div className="grid gap-2">
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label={t('dash.salesChart')}>
            {days.map(day => (
              <div key={day.date.toISOString()} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t-sm bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(day.total ? 4 : 0, (day.total / max) * 100)}%` }} />
                {day.total > 0 && (
                  <span className="pointer-events-none absolute -top-7 start-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[11px] text-bg group-hover:block rtl:translate-x-1/2">
                    {formatPrice(day.total)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] tabular-nums text-fg-subtle">
            <span>{label.format(days[0].date)}</span><span>{label.format(days[13].date)}</span>
          </div>
        </div>
      )}
    </section>
  )
}

function Kpi({ icon: Icon, label, value, tone = 'brand' }: { icon: typeof Package; label: string; value: string; tone?: 'brand' | 'accent' | 'warning' }) {
  const tones = { brand: 'bg-primary-soft text-primary-soft-fg', accent: 'bg-accent-soft text-accent-soft-fg', warning: 'bg-warning-soft text-warning' }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tones[tone])}><Icon aria-hidden className="size-5" /></span>
      <div className="grid min-w-0">
        <span className="truncate text-xs text-fg-muted">{label}</span>
        <span className="text-xl font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  )
}

// ─── Products ────────────────────────────────────────────────────────────────

const emptyProduct = { name: '', description: '', price: '', comparePrice: '', stock: '0', category: '', imageUrl: '', status: 'active' as ProductInput['status'] }

function ProductDialog({ product, open, onOpenChange, onSaved }: { product: Product | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => product ? {
    name: product.name, description: product.description ?? '', price: String(product.price), comparePrice: product.compare_price ? String(product.compare_price) : '',
    stock: String(product.stock), category: product.category?.name ?? '', imageUrl: product.primary_image ?? '',
    status: (product.status === 'deleted' ? 'inactive' : product.status) as ProductInput['status'],
  } : emptyProduct)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [key]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.name.trim().length < 2) next.name = t('auth.nameShort')
    const price = Number(form.price)
    if (!form.price || Number.isNaN(price) || price < 0) next.price = t('checkout.required')
    const compare = form.comparePrice ? Number(form.comparePrice) : null
    if (compare !== null && (Number.isNaN(compare) || compare <= price)) next.comparePrice = t('dash.comparePriceHint')
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError('')
    const body: ProductInput = {
      name: form.name.trim(), description: form.description || null, price, comparePrice: compare, stock: Number(form.stock) || 0,
      category: form.category.trim() || null, imageUrl: form.imageUrl || null, status: form.status,
    }
    try {
      if (product) await vendorApi.updateProduct(product.id, body)
      else await vendorApi.createProduct(body)
      toast({ title: t('dash.productSaved'), tone: 'success' })
      onSaved()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" title={product ? t('dash.editProduct') : t('dash.addProduct')}>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          {formError && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
          <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
            <ImageDrop label={t('dash.image')} value={form.imageUrl || null} onFile={async dataUrl => {
              const url = await vendorApi.uploadImage(dataUrl)
              setForm(f => ({ ...f, imageUrl: url }))
            }} onRemove={() => setForm(f => ({ ...f, imageUrl: '' }))} />
            <div className="grid content-start gap-4">
              <FormField label={t('dash.name')} required error={errors.name}><Input value={form.name} onChange={set('name')} maxLength={200} /></FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('dash.price')} required error={errors.price}><Input type="number" inputMode="decimal" min={0} step="0.01" value={form.price} onChange={set('price')} dir="ltr" /></FormField>
                <FormField label={t('dash.comparePrice')} error={errors.comparePrice}><Input type="number" inputMode="decimal" min={0} step="0.01" value={form.comparePrice} onChange={set('comparePrice')} dir="ltr" /></FormField>
                <FormField label={t('dash.stock')}><Input type="number" inputMode="numeric" min={0} value={form.stock} onChange={set('stock')} dir="ltr" /></FormField>
                <FormField label={t('dash.visibility')}>
                  <Select value={form.status} onChange={set('status')}>
                    <option value="active">{t('dash.statusActive')}</option>
                    <option value="draft">{t('dash.statusDraft')}</option>
                    <option value="inactive">{t('dash.statusInactive')}</option>
                  </Select>
                </FormField>
              </div>
              <FormField label={t('dash.category')}><Input value={form.category} onChange={set('category')} placeholder={t('dash.categoryPlaceholder')} /></FormField>
            </div>
          </div>
          <FormField label={t('dash.description')}><Textarea value={form.description} onChange={set('description')} rows={4} maxLength={5000} /></FormField>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t('common.cancel')}</Button></DialogClose>
            <Button type="submit" loading={saving}>{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProductsTab({ products, onChanged, onAdd, onEdit }: { products: Product[]; onChanged: () => void; onAdd: () => void; onEdit: (product: Product) => void }) {
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const statusTone = { active: 'success', draft: 'neutral', inactive: 'warning', deleted: 'neutral' } as const
  const statusLabel = { active: 'dash.statusActive', draft: 'dash.statusDraft', inactive: 'dash.statusInactive', deleted: 'dash.statusInactive' }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await vendorApi.deleteProduct(deleting.id)
      toast({ title: t('dash.productDeleted') })
      setDeleting(null)
      onChanged()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : t('common.loadError'), tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<Product>[] = [
    {
      key: 'name', header: t('dash.colProduct'), cell: product => (
        <span className="flex items-center gap-3">
          <span className="size-10 shrink-0 overflow-hidden rounded-md bg-surface-muted">
            {product.primary_image ? <img src={product.primary_image} alt="" className="size-full object-cover" /> : <ImageOff className="m-2.5 size-5 text-fg-subtle" />}
          </span>
          <span className="max-w-64 truncate font-medium">{product.name}</span>
        </span>
      ),
    },
    { key: 'price', header: t('dash.colPrice'), align: 'end', cell: p => <bdi className="tabular-nums">{formatPrice(p.price)}</bdi> },
    { key: 'stock', header: t('dash.colStock'), align: 'end', cell: p => <span className={cn('tabular-nums', p.stock <= 0 && 'text-danger', p.stock > 0 && p.stock <= 5 && 'text-warning')}>{p.stock}</span> },
    { key: 'status', header: t('dash.colStatus'), cell: p => <Badge tone={statusTone[p.status]}>{t(statusLabel[p.status])}</Badge> },
    {
      key: 'actions', header: <span className="sr-only">{t('dash.colActions')}</span>, align: 'end', cell: product => (
        <span className="inline-flex gap-1">
          <IconButton label={`${t('dash.editProduct')}: ${product.name}`} icon={<Pencil />} size="icon-sm" onClick={() => onEdit(product)} />
          <IconButton label={`${t('dash.deleteProduct')}: ${product.name}`} icon={<Trash2 />} size="icon-sm" onClick={() => setDeleting(product)} />
        </span>
      ),
    },
  ]

  return (
    <div className="grid gap-4">
      {!products.length ? (
        <EmptyState icon={<Package />} title={t('dash.noProducts')} message={t('dash.noProductsText')} action={<Button startIcon={<Plus />} onClick={onAdd}>{t('dash.addProduct')}</Button>} />
      ) : (
        <DataTable columns={columns} data={products} rowKey={p => p.id} caption={t('dash.products')} />
      )}
      <Dialog open={deleting !== null} onOpenChange={open => !open && setDeleting(null)}>
        <DialogContent size="sm" title={t('dash.deleteConfirm', { name: deleting?.name ?? '' })} description={t('dash.deleteConfirmText')}>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t('common.cancel')}</Button></DialogClose>
            <Button variant="danger" loading={busy} startIcon={<Trash2 />} onClick={remove}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Orders ──────────────────────────────────────────────────────────────────

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'confirmed', label: 'dash.actConfirm' },
  confirmed: { status: 'processing', label: 'dash.actProcess' },
  processing: { status: 'shipped', label: 'dash.actShip' },
  shipped: { status: 'delivered', label: 'dash.actDeliver' },
}
const FINAL = new Set<OrderStatus>(['delivered', 'cancelled', 'refunded'])

function OrdersTab({ items, onChanged }: { items: VendorOrderItem[]; onChanged: () => void }) {
  const { t, i18n } = useTranslation()
  const [shipping, setShipping] = useState<VendorOrderItem | null>(null)
  const [cancelling, setCancelling] = useState<VendorOrderItem | null>(null)
  const [tracking, setTracking] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  const update = async (item: VendorOrderItem, status: OrderStatus, trackingNumber?: string) => {
    setBusyId(item.id)
    try {
      await vendorApi.setItemStatus(item.id, status, trackingNumber)
      toast({ title: t('dash.statusUpdated'), tone: 'success' })
      setShipping(null)
      setCancelling(null)
      setTracking('')
      onChanged()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : t('common.loadError'), tone: 'danger' })
    } finally {
      setBusyId(null)
    }
  }

  const advance = (item: VendorOrderItem) => {
    const next = NEXT[item.vendor_status]
    if (!next) return
    if (next.status === 'shipped') setShipping(item)
    else update(item, next.status)
  }

  const columns: Column<VendorOrderItem>[] = [
    {
      key: 'order', header: t('dash.colOrder'), cell: item => (
        <span className="grid">
          <bdi className="font-mono text-xs">{item.orders?.order_number}</bdi>
          <span className="text-xs text-fg-subtle">{item.orders && date.format(new Date(item.orders.created_at))}</span>
        </span>
      ),
    },
    { key: 'product', header: t('dash.colProduct'), cell: item => <span className="block max-w-56 truncate">{item.product_name}{item.variant_info && <span className="text-fg-muted"> · {item.variant_info}</span>}</span> },
    { key: 'customer', header: t('dash.colCustomer'), cell: item => item.orders?.shipping_name ?? '—' },
    { key: 'qty', header: t('dash.colQty'), align: 'end', cell: item => <span className="tabular-nums">{item.quantity}</span> },
    { key: 'total', header: t('dash.colTotal'), align: 'end', cell: item => <bdi className="tabular-nums">{formatPrice(item.total_price)}</bdi> },
    { key: 'status', header: t('dash.colStatus'), cell: item => <OrderStatusBadge status={item.vendor_status} /> },
    {
      key: 'actions', header: <span className="sr-only">{t('dash.colActions')}</span>, align: 'end', cell: item => FINAL.has(item.vendor_status) ? null : (
        <span className="inline-flex gap-1.5">
          {NEXT[item.vendor_status] && (
            <Button size="sm" loading={busyId === item.id} onClick={() => advance(item)}>{t(NEXT[item.vendor_status]!.label)}</Button>
          )}
          <Button size="sm" variant="ghost" className="text-danger" disabled={busyId === item.id} onClick={() => setCancelling(item)}>{t('dash.actCancel')}</Button>
        </span>
      ),
    },
  ]

  return (
    <>
      {!items.length
        ? <EmptyState icon={<ShoppingCart />} title={t('dash.noOrders')} message={t('dash.noOrdersText')} />
        : <DataTable columns={columns} data={items} rowKey={item => item.id} caption={t('dash.orders')} />}

      <Dialog open={shipping !== null} onOpenChange={open => !open && setShipping(null)}>
        <DialogContent size="sm" title={t('dash.actShip')} description={shipping?.product_name}>
          <form onSubmit={event => { event.preventDefault(); if (shipping) update(shipping, 'shipped', tracking.trim() || undefined) }} className="grid gap-4">
            <FormField label={t('dash.trackingPrompt')}><Input value={tracking} onChange={e => setTracking(e.target.value)} dir="ltr" maxLength={100} /></FormField>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">{t('common.cancel')}</Button></DialogClose>
              <Button type="submit" loading={busyId === shipping?.id}>{t('dash.actShip')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelling !== null} onOpenChange={open => !open && setCancelling(null)}>
        <DialogContent size="sm" title={t('dash.cancelConfirm')} description={t('dash.cancelConfirmText')}>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t('common.back')}</Button></DialogClose>
            <Button variant="danger" loading={busyId === cancelling?.id} onClick={() => cancelling && update(cancelling, 'cancelled')}>{t('dash.actCancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Store settings ──────────────────────────────────────────────────────────

function StoreSettings({ vendor, onSaved }: { vendor: VendorMe; onSaved: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    storeName: vendor.store_name, description: vendor.description ?? '', location: vendor.location ?? '', phone: vendor.phone ?? '',
    website: vendor.website ?? '', whatsapp: vendor.whatsapp ?? '', instagram: vendor.instagram ?? '', facebook: vendor.facebook ?? '',
    tiktok: vendor.tiktok ?? '', youtube: vendor.youtube ?? '',
  })
  const [cover, setCover] = useState(vendor.cover_url)
  const [logo, setLogo] = useState(vendor.logo_url)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await vendorApi.updateProfile({ ...form, website: form.website || null })
      toast({ title: t('dash.storeSaved'), tone: 'success' })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSaving(false)
    }
  }

  const upload = (kind: 'cover' | 'logo') => async (dataUrl: string) => {
    if (kind === 'cover') { await vendorApi.uploadCover(dataUrl); setCover(dataUrl) } else { await vendorApi.uploadLogo(dataUrl); setLogo(dataUrl) }
    toast({ title: t('dash.storeSaved'), tone: 'success' })
  }

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
        <ImageDrop label={t('dash.logo')} value={logo} onFile={upload('logo')} preset="logo" />
        <ImageDrop label={t('dash.cover')} value={cover} onFile={upload('cover')} preset="cover" aspect="wide" />
      </div>
      {error && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('dash.storeName')} required><Input value={form.storeName} onChange={set('storeName')} maxLength={100} /></FormField>
        <FormField label={t('dash.location')}><Input value={form.location} onChange={set('location')} /></FormField>
        <div className="sm:col-span-2"><FormField label={t('dash.storeDescription')}><Textarea value={form.description} onChange={set('description')} rows={4} maxLength={2000} /></FormField></div>
        <FormField label={t('dash.phone')}><Input value={form.phone} onChange={set('phone')} type="tel" dir="ltr" /></FormField>
        <FormField label={t('dash.whatsapp')}><Input value={form.whatsapp} onChange={set('whatsapp')} type="tel" dir="ltr" placeholder="+961 70 000 000" /></FormField>
        <div className="sm:col-span-2"><FormField label={t('dash.website')}><Input value={form.website} onChange={set('website')} type="url" dir="ltr" placeholder="https://" /></FormField></div>
      </div>
      <fieldset className="grid gap-4">
        <legend className="text-sm font-semibold">{t('dash.socials')}</legend>
        <div className="grid gap-4 pt-3 sm:grid-cols-2">
          {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map(key => (
            <FormField key={key} label={key[0].toUpperCase() + key.slice(1)} hint={t('dash.handleHint')}>
              <Input value={form[key]} onChange={set(key)} dir="ltr" placeholder="@yourshop" />
            </FormField>
          ))}
        </div>
      </fieldset>
      <Button type="submit" className="w-fit" loading={saving}>{t('dash.saveStore')}</Button>
    </form>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

function Banner({ tone, icon: Icon, title, text, action }: { tone: 'warning' | 'danger' | 'info'; icon: typeof Clock; title: string; text: string; action?: React.ReactNode }) {
  const tones = { warning: 'bg-warning-soft text-warning', danger: 'bg-danger-soft text-danger', info: 'bg-info-soft text-info' }
  return (
    <div className={cn('flex flex-wrap items-center gap-3 rounded-lg px-4 py-3', tones[tone])}>
      <Icon aria-hidden className="size-5 shrink-0" />
      <div className="grid min-w-0 flex-1"><span className="text-sm font-semibold">{title}</span><span className="text-sm opacity-90">{text}</span></div>
      {action}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  usePageTitle(t('dash.title'))
  const user = useAuthStore(s => s.user)
  const [params, setParams] = useSearchParams()
  const tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'overview'
  const isVendor = Boolean(user?.vendor)

  const me = useAsync(signal => (isVendor ? vendorApi.me(signal) : Promise.resolve(null)), [isVendor])
  const vendor = me.data
  const orders = useAsync(signal => (vendor ? vendorApi.orders(vendor.id, signal) : Promise.resolve(null)), [vendor?.id])
  const subscription = useAsync(signal => (vendor ? vendorApi.subscription(signal) : Promise.resolve(null)), [vendor?.id])
  const [productDialog, setProductDialog] = useState<{ open: boolean; product: Product | null; key: number }>({ open: false, product: null, key: 0 })

  if (!isVendor) return <SetupShop onCreated={me.reload} />
  if (me.loading) return <Container className="grid gap-4 py-8"><Skeleton className="h-10 w-72" /><div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div><Skeleton className="h-64 rounded-lg" /></Container>
  if (me.error || !vendor) return <Container className="py-16"><ErrorState onRetry={me.reload} /></Container>

  const items = orders.data?.data ?? []
  const products = vendor.products
  const revenue = items.filter(i => i.vendor_status === 'delivered').reduce((sum, i) => sum + i.total_price, 0)
  const awaiting = items.filter(i => !FINAL.has(i.vendor_status)).length
  const live = products.filter(p => p.status === 'active').length
  const sub = subscription.data
  const openProduct = (product: Product | null) => setProductDialog(d => ({ open: true, product, key: d.key + 1 }))
  const setTab = (value: string) => setParams(value === 'overview' ? {} : { tab: value }, { replace: true })
  const refresh = () => { me.reload(); orders.reload() }

  return (
    <Container className="grid gap-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-accent">{t('dash.title')}</p>
          <h1 className="text-3xl font-semibold">{vendor.store_name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" endIcon={<ExternalLink />}><Link to={`/vendors/${vendor.slug}`}>{t('dash.viewShop')}</Link></Button>
          <Button startIcon={<Plus />} onClick={() => openProduct(null)}>{t('dash.addProduct')}</Button>
        </div>
      </div>

      <div className="grid gap-2">
        {vendor.status === 'pending' && <Banner tone="info" icon={Clock} title={t('dash.pendingApproval')} text={t('dash.pendingApprovalText')} />}
        {vendor.status === 'suspended' && <Banner tone="danger" icon={AlertTriangle} title={t('dash.suspended')} text={t('dash.suspendedText')} />}
        {vendor.listings_hidden && (
          <Banner tone="danger" icon={EyeOff} title={t('dash.hidden')} text={t('dash.hiddenText')} action={<Button asChild size="sm" variant="danger"><Link to="/subscribe">{t('dash.renew')}</Link></Button>} />
        )}
        {!vendor.listings_hidden && sub?.status !== 'active' && (
          <Banner
            tone="warning"
            icon={Star}
            title={sub?.status === 'pending_payment' ? t('dash.subPending') : t('dash.subNone')}
            text=""
            action={sub?.status !== 'pending_payment' && <Button asChild size="sm" variant="accent"><Link to="/subscribe">{t('dash.subscribe')}</Link></Button>}
          />
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('dash.overview')}</TabsTrigger>
          <TabsTrigger value="products">{t('dash.products')} ({products.length})</TabsTrigger>
          <TabsTrigger value="orders">{t('dash.orders')}{awaiting ? ` (${awaiting})` : ''}</TabsTrigger>
          <TabsTrigger value="store">{t('dash.store')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={CircleDollarSign} label={t('dash.kpiRevenue')} value={formatPrice(revenue)} />
            <Kpi icon={Clock} label={t('dash.kpiPending')} value={String(awaiting)} tone={awaiting ? 'warning' : 'brand'} />
            <Kpi icon={Package} label={t('dash.kpiProducts')} value={String(live)} tone="accent" />
            <Kpi icon={Star} label={t('dash.kpiRating')} value={vendor.total_reviews ? vendor.rating.toFixed(1) : '—'} />
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <SalesChart items={items} />
            <section className="grid content-start gap-3 rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-base font-semibold">{t('dash.recentOrders')}</h2>
                {items.length > 0 && <Button variant="link" size="sm" onClick={() => setTab('orders')}>{t('common.viewAll')}</Button>}
              </div>
              {orders.loading ? <Skeleton className="h-32" /> : !items.length ? <p className="py-6 text-center text-sm text-fg-muted">{t('dash.noOrders')}</p> : (
                <ul className="divide-y divide-border">
                  {items.slice(0, 5).map(item => (
                    <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="min-w-0 flex-1 truncate">{item.product_name} × {item.quantity}</span>
                      <OrderStatusBadge status={item.vendor_status} />
                      <bdi className="tabular-nums">{formatPrice(item.total_price)}</bdi>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab products={products} onChanged={me.reload} onAdd={() => openProduct(null)} onEdit={openProduct} />
        </TabsContent>
        <TabsContent value="orders">
          {orders.error ? <ErrorState onRetry={orders.reload} /> : orders.loading ? <Skeleton className="h-64 rounded-lg" /> : <OrdersTab items={items} onChanged={refresh} />}
        </TabsContent>
        <TabsContent value="store"><StoreSettings vendor={vendor} onSaved={me.reload} /></TabsContent>
      </Tabs>

      <ProductDialog
        key={productDialog.key}
        product={productDialog.product}
        open={productDialog.open}
        onOpenChange={open => setProductDialog(d => ({ ...d, open }))}
        onSaved={() => { setProductDialog(d => ({ ...d, open: false })); me.reload() }}
      />
    </Container>
  )
}
