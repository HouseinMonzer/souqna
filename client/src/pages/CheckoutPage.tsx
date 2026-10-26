import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Banknote, Check, CircleCheckBig, MapPin, Pencil, ShoppingBag } from 'lucide-react'
import {
  Breadcrumbs, Button, Checkbox, EmptyState, FormField, Input, RadioGroup, RadioItem, Skeleton, Textarea, formatPrice,
} from '../components/ui'
import { Container } from '../components/layout/Container'
import { addresses as addressApi, orders, type Address, type OrderDetail } from '../api/account'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'

const DELIVERY_FEE = 3.5
const PHONE = /^\+?[\d\s()-]{6,30}$/
type Step = 0 | 1 | 2

interface NewAddress { fullName: string; phone: string; line1: string; city: string }

function Stepper({ step }: { step: Step }) {
  const { t } = useTranslation()
  const labels = [t('checkout.stepAddress'), t('checkout.stepPayment'), t('checkout.stepReview')]
  return (
    <ol aria-label={t('checkout.steps')} className="flex items-center gap-2 sm:gap-3">
      {labels.map((label, index) => {
        const done = index < step
        const current = index === step
        return (
          <li key={label} aria-current={current ? 'step' : undefined} className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3">
            <span className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              done ? 'bg-primary text-primary-fg' : current ? 'border-2 border-primary text-primary' : 'border border-border-strong text-fg-subtle',
            )}>
              {done ? <Check aria-hidden className="size-4" /> : index + 1}
            </span>
            <span className={cn('text-sm font-medium', current ? 'text-fg' : 'text-fg-muted', !current && 'max-sm:sr-only')}>{label}</span>
            {index < labels.length - 1 && <span aria-hidden className={cn('h-px flex-1', done ? 'bg-primary' : 'bg-border')} />}
          </li>
        )
      })}
    </ol>
  )
}

function addressLine(address: Pick<Address, 'line1' | 'line2' | 'city'>) {
  return [address.line1, address.line2, address.city].filter(Boolean).join(', ')
}

export default function CheckoutPage() {
  const { vendorId = '' } = useParams()
  const { t } = useTranslation()
  usePageTitle(t('checkout.title'))
  const user = useAuthStore(s => s.user)
  const cart = useCartStore(s => s.getVendorCart(vendorId))
  const clearVendorCart = useCartStore(s => s.clearVendorCart)
  const saved = useAsync(signal => addressApi.list(signal), [])

  const [step, setStep] = useState<Step>(0)
  const [addressId, setAddressId] = useState<string>('new')
  const [form, setForm] = useState<NewAddress>({ fullName: user?.profile?.full_name ?? '', phone: user?.profile?.phone ?? '', line1: '', city: '' })
  const [saveAddress, setSaveAddress] = useState(true)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof NewAddress, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState<{ order: OrderDetail; vendorName: string } | null>(null)
  // One key per visit to checkout: a retry after a dropped connection replays
  // the same order instead of creating a second one.
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  // Preselect the default saved address once addresses load.
  useEffect(() => {
    const list = saved.data
    if (list?.length) setAddressId(list.find(a => a.is_default)?.id ?? list[0].id)
  }, [saved.data])

  if (placed) {
    return (
      <Container className="grid max-w-xl justify-items-center gap-5 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success"><CircleCheckBig aria-hidden className="size-8" /></span>
        <h1 className="text-3xl font-semibold">{t('checkout.placed')}</h1>
        <p className="text-fg-muted">{t('checkout.placedText', { vendor: placed.vendorName })}</p>
        <div className="grid gap-1 rounded-lg bg-surface-muted px-6 py-4">
          <span className="text-sm text-fg-muted">{t('checkout.orderNumber')}</span>
          <bdi className="font-mono text-lg font-semibold">{placed.order.order_number}</bdi>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild><Link to={`/account/orders/${placed.order.id}`}>{t('checkout.track')}</Link></Button>
          <Button asChild variant="outline"><Link to="/shop">{t('checkout.keepShopping')}</Link></Button>
        </div>
      </Container>
    )
  }

  if (!cart?.items.length) {
    return (
      <Container className="py-16">
        <EmptyState icon={<ShoppingBag />} title={t('checkout.emptyCart')} action={<Button asChild><Link to="/cart">{t('cart.title')}</Link></Button>} />
      </Container>
    )
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const total = subtotal + DELIVERY_FEE
  const selected = saved.data?.find(a => a.id === addressId)
  const usingNew = addressId === 'new'

  const submitAddress = (event: FormEvent) => {
    event.preventDefault()
    if (usingNew) {
      const next: typeof errors = {}
      for (const key of ['fullName', 'phone', 'line1', 'city'] as const) if (!form[key].trim()) next[key] = t('checkout.required')
      if (form.phone.trim() && !PHONE.test(form.phone.trim())) next.phone = t('checkout.phoneInvalid')
      setErrors(next)
      if (Object.keys(next).length) return
    }
    setStep(1)
  }

  const placeOrder = async () => {
    setPlacing(true)
    setSubmitError('')
    try {
      let shippingInfo: Record<string, string | undefined>
      if (usingNew && saveAddress) {
        const created = await addressApi.create({ ...form, isDefault: !saved.data?.length })
        setAddressId(created.id)
        shippingInfo = { address_id: created.id }
      } else if (usingNew) {
        shippingInfo = { shipping_name: form.fullName, shipping_phone: form.phone, shipping_address: form.line1, shipping_city: form.city }
      } else {
        shippingInfo = { address_id: addressId }
      }
      const order = await orders.place({
        cartItems: cart.items.map(item => ({ product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity })),
        shippingInfo: { ...shippingInfo, customer_note: note || undefined, payment_method: 'cash_delivery' },
      }, idempotencyKey)
      // Keep the shop name: the cart (its only source here) is cleared next.
      setPlaced({ order, vendorName: cart.vendorName })
      clearVendorCart(vendorId)
      window.scrollTo(0, 0)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('common.loadError'))
    } finally {
      setPlacing(false)
    }
  }

  const field = (key: keyof NewAddress, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <FormField label={label} required error={errors[key]}>
      <Input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} {...props} />
    </FormField>
  )

  const summaryRow = (label: string, value: number, strong?: boolean) => (
    <div className={cn('flex justify-between', strong ? 'text-base font-semibold' : 'text-sm text-fg-muted')}>
      <span>{label}</span><bdi className="tabular-nums">{formatPrice(value)}</bdi>
    </div>
  )

  return (
    <Container className="grid gap-6 py-6 sm:py-8">
      <Breadcrumbs items={[{ label: t('cart.title'), to: '/cart' }, { label: t('checkout.title') }]} />
      <h1 className="text-3xl font-semibold">{t('checkout.title')}</h1>
      <Stepper step={step} />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="grid content-start gap-5">
          {step === 0 && (
            <form onSubmit={submitAddress} className="grid gap-5 rounded-lg border border-border bg-surface p-5" noValidate>
              <h2 className="font-sans text-lg font-semibold">{t('checkout.stepAddress')}</h2>
              {saved.loading ? <Skeleton className="h-20 rounded-lg" /> : !!saved.data?.length && (
                <RadioGroup value={addressId} onValueChange={setAddressId} aria-label={t('checkout.savedAddresses')}>
                  {saved.data.map(address => (
                    <RadioItem key={address.id} value={address.id} label={address.label || address.full_name} description={`${addressLine(address)} · ${address.phone}`} />
                  ))}
                  <RadioItem value="new" label={t('checkout.newAddress')} />
                </RadioGroup>
              )}
              {usingNew && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {field('fullName', t('checkout.fullName'), { autoComplete: 'name' })}
                  {field('phone', t('checkout.phone'), { type: 'tel', autoComplete: 'tel', inputMode: 'tel', dir: 'ltr' })}
                  <div className="sm:col-span-2">{field('line1', t('checkout.address'), { autoComplete: 'street-address' })}</div>
                  {field('city', t('checkout.city'), { autoComplete: 'address-level2' })}
                  <div className="flex items-end sm:pb-2.5">
                    <Checkbox label={t('checkout.saveAddress')} checked={saveAddress} onCheckedChange={v => setSaveAddress(v === true)} />
                  </div>
                </div>
              )}
              <FormField label={t('checkout.notes')}>
                <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={1000} placeholder={t('checkout.notesPlaceholder')} />
              </FormField>
              <Button type="submit" className="w-fit">{t('checkout.continue')}</Button>
            </form>
          )}

          {step === 1 && (
            <div className="grid gap-5 rounded-lg border border-border bg-surface p-5">
              <h2 className="font-sans text-lg font-semibold">{t('checkout.payment')}</h2>
              <RadioGroup value="cash" aria-label={t('checkout.payment')}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-primary bg-primary-soft/40 p-4">
                  <RadioItem value="cash" aria-label={t('checkout.cash')} />
                  <Banknote aria-hidden className="mt-0.5 size-5 text-primary" />
                  <span className="grid gap-0.5">
                    <span className="font-semibold">{t('checkout.cash')}</span>
                    <span className="text-sm text-fg-muted">{t('checkout.cashText')}</span>
                  </span>
                </label>
              </RadioGroup>
              <p className="text-sm text-fg-subtle">{t('checkout.otherMethods')}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}>{t('checkout.back')}</Button>
                <Button onClick={() => setStep(2)}>{t('checkout.continue')}</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 rounded-lg border border-border bg-surface p-5">
              <h2 className="font-sans text-lg font-semibold">{t('checkout.review')}</h2>
              <div className="flex items-start gap-3 rounded-lg bg-surface-muted p-4">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-fg-subtle" />
                <div className="grid flex-1 gap-0.5 text-sm">
                  <span className="font-semibold">{t('checkout.deliverTo')}</span>
                  <span>{usingNew ? form.fullName : selected?.full_name} · <bdi>{usingNew ? form.phone : selected?.phone}</bdi></span>
                  <span className="text-fg-muted">{usingNew ? `${form.line1}, ${form.city}` : selected && addressLine(selected)}</span>
                </div>
                <Button variant="ghost" size="sm" startIcon={<Pencil />} onClick={() => setStep(0)}>{t('checkout.edit')}</Button>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-4 text-sm">
                <Banknote aria-hidden className="size-5 text-fg-subtle" />
                <span className="font-semibold">{t('checkout.cash')}</span>
              </div>
              {submitError && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{submitError}</p>}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>{t('checkout.back')}</Button>
                <Button variant="accent" size="lg" loading={placing} onClick={placeOrder}>
                  {t('checkout.placeOrder', { total: formatPrice(total) })}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="grid gap-4 rounded-lg border border-border bg-surface p-5">
            <h2 className="font-sans text-base font-semibold">{t('cart.fromVendor', { vendor: cart.vendorName })}</h2>
            <ul className="grid gap-3">
              {cart.items.map(item => (
                <li key={`${item.product_id}-${item.variant_id}`} className="flex items-center gap-3 text-sm">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    {item.product.primary_image && <img src={item.product.primary_image} alt="" className="size-full object-cover" />}
                    <span className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-fg text-[11px] font-bold text-bg">{item.quantity}</span>
                  </span>
                  <span className="line-clamp-2 min-w-0 flex-1">{item.product.name}{item.variant && <span className="text-fg-muted"> · {item.variant.option_value}</span>}</span>
                  <bdi className="tabular-nums">{formatPrice(item.product.price * item.quantity)}</bdi>
                </li>
              ))}
            </ul>
            <div className="grid gap-2 border-t border-border pt-4">
              {summaryRow(t('cart.subtotal'), subtotal)}
              {summaryRow(t('cart.delivery'), DELIVERY_FEE)}
              {summaryRow(t('cart.total'), total, true)}
            </div>
          </div>
        </aside>
      </div>
    </Container>
  )
}
