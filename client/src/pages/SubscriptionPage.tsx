import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Banknote, Check, CircleCheckBig, Smartphone, Store, Wallet } from 'lucide-react'
import { Badge, Button, EmptyState, FormField, Skeleton, Textarea, formatPrice } from '../components/ui'
import { Container } from '../components/layout/Container'
import { ImageDrop } from '../components/commerce/ImageDrop'
import { apiFetch } from '../lib/api'
import { config } from '../lib/config'
import { cn } from '../lib/utils'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuthStore } from '../store/authStore'
import { vendorApi } from '../api/vendor'
import { SUBSCRIPTION_PRICES, type SubscriptionPlan } from '../types/database.types'

type Method = 'wish_money' | 'omt' | 'cash_delivery'

export default function SubscriptionPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('sub.title'))
  const isVendor = Boolean(useAuthStore(s => s.user?.vendor))
  const current = useAsync(signal => (isVendor ? vendorApi.subscription(signal) : Promise.resolve(null)), [isVendor])
  const [plan, setPlan] = useState<SubscriptionPlan>('annual')
  const [method, setMethod] = useState<Method>('wish_money')
  const [proof, setProof] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!isVendor) {
    return <Container className="py-16"><EmptyState icon={<Store />} title={t('sub.vendorOnly')} action={<Button asChild><Link to="/dashboard">{t('dash.setupButton')}</Link></Button>} /></Container>
  }
  if (done) {
    return (
      <Container className="grid max-w-lg justify-items-center gap-4 py-16 text-center">
        <CircleCheckBig aria-hidden className="size-14 text-success" />
        <h1 className="text-3xl font-semibold">{t('sub.submitted')}</h1>
        <p className="text-fg-muted">{t('sub.submittedText')}</p>
        <Button asChild><Link to="/dashboard">{t('sub.backToDashboard')}</Link></Button>
      </Container>
    )
  }

  const savings = Math.round(100 - (SUBSCRIPTION_PRICES.annual / (SUBSCRIPTION_PRICES.monthly * 12)) * 100)
  const amount = formatPrice(SUBSCRIPTION_PRICES[plan])
  const transferTarget = method === 'wish_money' ? config.paymentWishNumber : method === 'omt' ? config.paymentOmtDetails : null
  const methods: { id: Method; label: string; icon: typeof Wallet }[] = [
    { id: 'wish_money', label: t('sub.wish'), icon: Wallet },
    { id: 'omt', label: t('sub.omt'), icon: Smartphone },
    { id: 'cash_delivery', label: t('sub.cash'), icon: Banknote },
  ]
  const sub = current.data
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (method !== 'cash_delivery' && !proof) return setError(t('sub.proofRequired'))
    if (method === 'cash_delivery' && !address.trim()) return setError(t('sub.addressRequired'))
    setSubmitting(true)
    setError('')
    try {
      await apiFetch('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ plan, paymentMethod: method, paymentProof: method === 'cash_delivery' ? null : proof, shippingAddress: method === 'cash_delivery' ? address : null }),
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  const option = (active: boolean) => cn(
    'relative grid cursor-pointer gap-1 rounded-lg border-2 p-4 text-start transition-colors',
    active ? 'border-primary bg-primary-soft/40' : 'border-border hover:border-border-strong',
  )

  return (
    <Container className="grid max-w-3xl gap-6 py-8">
      <div className="grid gap-1">
        <h1 className="text-3xl font-semibold">{t('sub.title')}</h1>
        <p className="text-fg-muted">{t('sub.subtitle')}</p>
      </div>

      {current.loading ? <Skeleton className="h-16 rounded-lg" /> : sub && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-muted px-4 py-3 text-sm">
          <span className="font-semibold">{t('sub.current')}:</span>
          <span>{t(`sub.${sub.plan}`)}</span>
          <Badge tone={sub.status === 'active' ? 'success' : sub.status === 'pending_payment' ? 'warning' : 'neutral'}>
            {t(`sub.status_${sub.status}`, { date: sub.end_date ? date.format(new Date(sub.end_date)) : '' })}
          </Badge>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6" noValidate>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold">{t('sub.choosePlan')}</legend>
          <div className="grid gap-3 pt-3 sm:grid-cols-2">
            {(['monthly', 'annual'] as const).map(id => (
              <button key={id} type="button" aria-pressed={plan === id} onClick={() => setPlan(id)} className={option(plan === id)}>
                {id === 'annual' && <Badge tone="accent" appearance="solid" size="sm" className="absolute end-3 top-3">{t('sub.save', { percent: savings })}</Badge>}
                <span className="font-semibold">{t(`sub.${id}`)}</span>
                <span><bdi className="text-2xl font-bold tabular-nums">{formatPrice(SUBSCRIPTION_PRICES[id])}</bdi> <span className="text-sm text-fg-muted">{t(id === 'monthly' ? 'sub.perMonth' : 'sub.perYear')}</span></span>
                {plan === id && <Check aria-hidden className="absolute bottom-3 end-3 size-5 text-primary" />}
              </button>
            ))}
          </div>
          <p className="text-sm text-fg-muted">{t('sub.features')}</p>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold">{t('sub.payment')}</legend>
          <div className="grid gap-3 pt-3 sm:grid-cols-3">
            {methods.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={method === id} onClick={() => { setMethod(id); setError('') }} className={cn(option(method === id), 'flex items-center gap-2.5')}>
                <Icon aria-hidden className="size-5 text-fg-muted" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {method !== 'cash_delivery' ? (
          <div className="grid gap-4 rounded-lg border border-border bg-surface p-5">
            <p className="text-sm">
              {transferTarget
                ? <>{t('sub.transferTo', { amount })} <bdi className="font-mono font-semibold">{transferTarget}</bdi></>
                : <>{t('sub.transferMissing')} <Link to="/contact" className="font-semibold text-primary underline">{t('footer.contact')}</Link></>}
            </p>
            <ImageDrop label={t('sub.proof')} value={proof} onFile={dataUrl => setProof(dataUrl)} onRemove={() => setProof(null)} preset="document" />
          </div>
        ) : (
          <div className="grid gap-3 rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-fg-muted">{t('sub.cashText')}</p>
            <FormField label={t('sub.address')} required><Textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} maxLength={500} /></FormField>
          </div>
        )}

        {error && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" size="lg" variant="accent" className="w-fit" loading={submitting}>{t('sub.submit')} · {amount}</Button>
      </form>
    </Container>
  )
}
