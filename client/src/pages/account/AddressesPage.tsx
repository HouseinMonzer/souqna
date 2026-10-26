import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  Badge, Button, Checkbox, Dialog, DialogClose, DialogContent, DialogFooter, EmptyState, FormField, IconButton, Input, Skeleton, toast,
} from '../../components/ui'
import { ErrorState } from '../../components/commerce/ErrorState'
import { addresses as api, type Address, type AddressInput } from '../../api/account'
import { useAsync } from '../../hooks/useAsync'
import { usePageTitle } from '../../hooks/usePageTitle'

const PHONE = /^\+?[\d\s()-]{6,30}$/
const empty: AddressInput = { label: '', fullName: '', phone: '', line1: '', line2: '', city: '', region: '', isDefault: false }

function AddressForm({ initial, onSaved, onCancel }: { initial?: Address; onSaved: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [values, setValues] = useState<AddressInput>(initial ? {
    label: initial.label ?? '', fullName: initial.full_name, phone: initial.phone, line1: initial.line1,
    line2: initial.line2 ?? '', city: initial.city, region: initial.region ?? '', isDefault: initial.is_default,
  } : empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const set = (key: keyof AddressInput) => (event: React.ChangeEvent<HTMLInputElement>) => setValues(v => ({ ...v, [key]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    for (const key of ['fullName', 'phone', 'line1', 'city'] as const) if (!values[key]?.trim()) next[key] = t('checkout.required')
    if (values.phone.trim() && !PHONE.test(values.phone.trim())) next.phone = t('checkout.phoneInvalid')
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError('')
    try {
      const body = { ...values, label: values.label || null, line2: values.line2 || null, region: values.region || null }
      if (initial) await api.update(initial.id, { ...body, isDefault: values.isDefault || undefined })
      else await api.create(body)
      toast({ title: t('account.saved'), tone: 'success' })
      onSaved()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      {formError && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('account.label')}><Input value={values.label ?? ''} onChange={set('label')} placeholder={t('account.labelPlaceholder')} /></FormField>
        <FormField label={t('checkout.fullName')} required error={errors.fullName}><Input value={values.fullName} onChange={set('fullName')} autoComplete="name" /></FormField>
        <FormField label={t('checkout.phone')} required error={errors.phone}><Input value={values.phone} onChange={set('phone')} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" /></FormField>
        <FormField label={t('checkout.city')} required error={errors.city}><Input value={values.city} onChange={set('city')} autoComplete="address-level2" /></FormField>
        <div className="sm:col-span-2"><FormField label={t('checkout.address')} required error={errors.line1}><Input value={values.line1} onChange={set('line1')} autoComplete="street-address" /></FormField></div>
        <FormField label={t('account.line2')}><Input value={values.line2 ?? ''} onChange={set('line2')} /></FormField>
        <FormField label={t('account.region')}><Input value={values.region ?? ''} onChange={set('region')} /></FormField>
      </div>
      {!initial?.is_default && <Checkbox label={t('account.makeDefault')} checked={!!values.isDefault} onCheckedChange={v => setValues(s => ({ ...s, isDefault: v === true }))} />}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={saving}>{t('common.save')}</Button>
      </DialogFooter>
    </form>
  )
}

export default function AddressesPage() {
  const { t } = useTranslation()
  usePageTitle(t('account.addresses'))
  const { data, loading, error, reload } = useAsync(signal => api.list(signal), [])
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Address | null>(null)
  const [busy, setBusy] = useState(false)

  const makeDefault = async (address: Address) => {
    await api.update(address.id, { isDefault: true })
    reload()
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api.remove(deleting.id)
      toast({ title: t('account.deleted') })
      setDeleting(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{t('account.addresses')}</h1>
        {!!data?.length && <Button startIcon={<Plus />} onClick={() => setEditing('new')}>{t('account.addAddress')}</Button>}
      </div>
      {error ? <ErrorState onRetry={reload} /> : loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map(i => <Skeleton key={i} className="h-36 rounded-lg" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<MapPin />} title={t('account.noAddresses')} message={t('account.noAddressesText')}
          action={<Button startIcon={<Plus />} onClick={() => setEditing('new')}>{t('account.addAddress')}</Button>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map(address => (
            <li key={address.id} className="grid content-between gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="grid gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{address.label || address.full_name}</span>
                  {address.is_default && <Badge tone="brand" size="sm">{t('account.default')}</Badge>}
                </div>
                {address.label && <span>{address.full_name}</span>}
                <span className="text-fg-muted">{[address.line1, address.line2, address.city, address.region].filter(Boolean).join(', ')}</span>
                <bdi className="text-fg-muted">{address.phone}</bdi>
              </div>
              <div className="flex items-center gap-1">
                {!address.is_default && <Button variant="ghost" size="sm" startIcon={<Star />} onClick={() => makeDefault(address)}>{t('account.makeDefault')}</Button>}
                <IconButton className="ms-auto" label={t('account.editAddress')} icon={<Pencil />} size="icon-sm" onClick={() => setEditing(address)} />
                <IconButton label={t('account.deleteAddress')} icon={<Trash2 />} size="icon-sm" onClick={() => setDeleting(address)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent size="lg" title={editing === 'new' ? t('account.addAddress') : t('account.editAddress')}>
          {editing !== null && (
            <AddressForm initial={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={open => !open && setDeleting(null)}>
        <DialogContent size="sm" title={t('account.deleteConfirm')} description={t('account.deleteConfirmText')}>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t('common.cancel')}</Button></DialogClose>
            <Button variant="danger" loading={busy} startIcon={<Trash2 />} onClick={confirmDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
