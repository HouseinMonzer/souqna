import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheckBig, Mail, MessageCircle } from 'lucide-react'
import { Button, FormField, Input, Textarea } from '../components/ui'
import { Container } from '../components/layout/Container'
import { apiFetch } from '../lib/api'
import { config } from '../lib/config'
import { useAuthStore } from '../store/authStore'
import { usePageTitle } from '../hooks/usePageTitle'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactPage() {
  const { t } = useTranslation()
  usePageTitle(t('contact.title'))
  const user = useAuthStore(s => s.user)
  const blank = { name: user?.profile?.full_name ?? '', email: user?.email ?? '', subject: '', message: '' }
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.name.trim().length < 2) next.name = t('auth.nameShort')
    if (!EMAIL.test(form.email.trim())) next.email = t('auth.emailInvalid')
    if (form.message.trim().length < 10) next.message = t('auth.required')
    setErrors(next)
    if (Object.keys(next).length) return
    setSending(true)
    setError('')
    try {
      await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({ ...form, subject: form.subject || undefined }) })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSending(false)
    }
  }

  const whatsapp = config.supportWhatsapp?.replace(/\D/g, '')

  return (
    <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_20rem]">
      <div className="grid content-start gap-6">
        <div className="grid gap-2">
          <h1 className="text-4xl font-semibold">{t('contact.title')}</h1>
          <p className="text-fg-muted">{t('contact.subtitle')}</p>
        </div>
        {sent ? (
          <div className="grid justify-items-start gap-3 rounded-lg border border-border bg-surface p-6">
            <CircleCheckBig aria-hidden className="size-10 text-success" />
            <h2 className="font-sans text-xl font-semibold">{t('contact.sent')}</h2>
            <p className="text-fg-muted">{t('contact.sentText')}</p>
            <Button variant="outline" onClick={() => { setForm(blank); setSent(false) }}>{t('contact.another')}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-surface p-5" noValidate>
            {error && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('contact.name')} required error={errors.name}><Input value={form.name} onChange={set('name')} autoComplete="name" /></FormField>
              <FormField label={t('contact.email')} required error={errors.email}><Input type="email" value={form.email} onChange={set('email')} autoComplete="email" dir="ltr" /></FormField>
            </div>
            <FormField label={t('contact.subject')}><Input value={form.subject} onChange={set('subject')} maxLength={150} /></FormField>
            <FormField label={t('contact.message')} required hint={t('contact.orderHelp')} error={errors.message}>
              <Textarea value={form.message} onChange={set('message')} rows={6} maxLength={5000} />
            </FormField>
            <Button type="submit" className="w-fit" loading={sending}>{t('contact.send')}</Button>
          </form>
        )}
      </div>
      {(config.supportEmail || whatsapp) && (
        <aside className="grid content-start gap-3">
          <h2 className="font-sans text-base font-semibold">{t('contact.channels')}</h2>
          {config.supportEmail && (
            <a href={`mailto:${config.supportEmail}`} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-border-strong">
              <Mail aria-hidden className="size-5 text-fg-subtle" />
              <span className="grid"><span className="text-xs text-fg-muted">{t('contact.emailUs')}</span><span className="font-medium" dir="ltr">{config.supportEmail}</span></span>
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-border-strong">
              <MessageCircle aria-hidden className="size-5 text-fg-subtle" />
              <span className="grid"><span className="text-xs text-fg-muted">{t('contact.whatsapp')}</span><bdi className="font-medium">{config.supportWhatsapp}</bdi></span>
            </a>
          )}
        </aside>
      )}
    </Container>
  )
}
