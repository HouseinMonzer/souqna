import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MailCheck } from 'lucide-react'
import { Button } from '../components/ui'
import { AuthShell } from '../components/auth/AuthShell'
import { ApiError, apiFetch } from '../lib/api'
import { usePageTitle } from '../hooks/usePageTitle'

export default function VerifyPendingPage() {
  const { t } = useTranslation()
  usePageTitle(t('auth.pendingTitle'))
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const [cooldown, setCooldown] = useState(60)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const resend = async () => {
    setSending(true)
    setMessage('')
    try {
      await apiFetch('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })
      setMessage(t('auth.resent'))
      setCooldown(60)
    } catch (err) {
      const wait = err instanceof ApiError ? Number(err.body?.wait) : NaN
      if (wait > 0) setCooldown(wait)
      setMessage(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthShell title={t('auth.pendingTitle')}>
      <div className="grid gap-5">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg"><MailCheck aria-hidden className="size-7" /></span>
        <p className="text-fg-muted">{t('auth.pendingText', { email: email || '—' })}</p>
        <p className="text-sm text-fg-muted">{t('auth.pendingHelp')}</p>
        {message && <p role="status" className="rounded-md bg-surface-muted px-4 py-3 text-sm">{message}</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={!email || cooldown > 0} loading={sending} onClick={resend}>
            {cooldown > 0 ? t('auth.resendIn', { seconds: cooldown }) : t('auth.resend')}
          </Button>
          <Button asChild variant="ghost"><Link to="/login">{t('auth.backToLogin')}</Link></Button>
        </div>
      </div>
    </AuthShell>
  )
}
