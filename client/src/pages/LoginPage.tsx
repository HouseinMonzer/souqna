import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, FormField, Input } from '../components/ui'
import { AuthShell } from '../components/auth/AuthShell'
import { OrDivider, SocialButtons } from '../components/auth/SocialButtons'
import { PasswordInput } from '../components/auth/PasswordInput'
import { useAuthStore } from '../store/authStore'
import { ApiError, apiFetch } from '../lib/api'
import { postLoginPath } from '../lib/authRedirect'
import { usePageTitle } from '../hooks/usePageTitle'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OAUTH_ERRORS: Record<string, string> = {
  google: 'auth.googleFailed', facebook: 'auth.facebookFailed', account_exists: 'auth.oauthAccountExists',
}

export default function LoginPage() {
  const { t } = useTranslation()
  usePageTitle(t('auth.loginButton'))
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const from = (location.state as { from?: string } | null)?.from
  const user = useAuthStore(s => s.user)
  const signIn = useAuthStore(s => s.signIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState(() => {
    const key = OAUTH_ERRORS[params.get('error') ?? '']
    return key ? t(key) : ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (user) navigate(postLoginPath(user, from), { replace: true })
  }, [user, from, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const validate = () => {
    const next: typeof fieldErrors = {}
    if (!EMAIL.test(email.trim())) next.email = t('auth.emailInvalid')
    if (!password) next.password = t('auth.required')
    setFieldErrors(next)
    return !Object.keys(next).length
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setError('')
    setNeedsVerification(false)
    try {
      const signedIn = await signIn(email.trim(), password)
      navigate(postLoginPath(signedIn, from), { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.body?.needsVerification) {
        setNeedsVerification(true)
        setError(t('auth.needsVerification'))
      } else {
        setError(err instanceof Error ? err.message : t('common.loadError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resend = async () => {
    setResendMessage('')
    try {
      await apiFetch('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email: email.trim() }) })
      setResendMessage(t('auth.resent'))
      setCooldown(60)
    } catch (err) {
      const wait = err instanceof ApiError ? Number(err.body?.wait) : NaN
      if (wait > 0) setCooldown(wait)
      setResendMessage(err instanceof Error ? err.message : t('common.loadError'))
    }
  }

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <SocialButtons />
      <OrDivider />
      <form onSubmit={submit} className="grid gap-4" noValidate>
        {error && (
          <div role="alert" className="grid gap-2 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
            <span className="font-medium">{error}</span>
            {needsVerification && (
              <Button type="button" variant="link" size="sm" className="justify-self-start text-danger" disabled={cooldown > 0} onClick={resend}>
                {cooldown > 0 ? t('auth.resendIn', { seconds: cooldown }) : t('auth.resend')}
              </Button>
            )}
            {resendMessage && <span>{resendMessage}</span>}
          </div>
        )}
        <FormField label={t('auth.email')} error={fieldErrors.email}>
          <Input type="email" autoComplete="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} />
        </FormField>
        <FormField label={t('auth.password')} error={fieldErrors.password}>
          <PasswordInput autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
        </FormField>
        <Button type="submit" size="lg" loading={submitting}>{t('auth.loginButton')}</Button>
      </form>
      <p className="text-center text-sm text-fg-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" state={location.state} className="font-semibold text-primary hover:underline">{t('auth.signUp')}</Link>
      </p>
    </AuthShell>
  )
}
