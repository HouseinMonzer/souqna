import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Button, FormField, Input } from '../components/ui'
import { AuthShell } from '../components/auth/AuthShell'
import { OrDivider, SocialButtons } from '../components/auth/SocialButtons'
import { PasswordInput, PasswordStrength } from '../components/auth/PasswordInput'
import { useAuthStore } from '../store/authStore'
import { postLoginPath } from '../lib/authRedirect'
import { usePageTitle } from '../hooks/usePageTitle'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
type Field = 'name' | 'email' | 'password'

export default function RegisterPage() {
  const { t } = useTranslation()
  usePageTitle(t('auth.registerButton'))
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const signUp = useAuthStore(s => s.signUp)
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate(postLoginPath(user), { replace: true })
  }, [user, navigate])

  const errors: Partial<Record<Field, string>> = {
    ...(values.name.trim().length < 2 ? { name: values.name ? t('auth.nameShort') : t('auth.required') } : {}),
    ...(!EMAIL.test(values.email.trim()) ? { email: values.email ? t('auth.emailInvalid') : t('auth.required') } : {}),
    ...(values.password.length < 8 ? { password: values.password ? t('auth.passwordShort') : t('auth.required') } : {}),
  }
  // Errors appear once a field has been left, not while the visitor is still typing.
  const shown = (field: Field) => (touched[field] ? errors[field] : undefined)
  const set = (field: Field) => (event: React.ChangeEvent<HTMLInputElement>) => setValues(v => ({ ...v, [field]: event.target.value }))
  const blur = (field: Field) => () => setTouched(s => ({ ...s, [field]: true }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ name: true, email: true, password: true })
    if (Object.keys(errors).length) return
    setSubmitting(true)
    setError('')
    try {
      await signUp(values.email.trim(), values.password, values.name.trim())
      navigate(`/verify-pending?email=${encodeURIComponent(values.email.trim())}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <SocialButtons />
      <OrDivider />
      <form onSubmit={submit} className="grid gap-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}
        <FormField label={t('auth.fullName')} error={shown('name')}>
          <Input autoComplete="name" value={values.name} onChange={set('name')} onBlur={blur('name')} />
        </FormField>
        <FormField label={t('auth.email')} error={shown('email')}>
          <Input type="email" autoComplete="email" dir="ltr" value={values.email} onChange={set('email')} onBlur={blur('email')} />
        </FormField>
        <FormField label={t('auth.password')} hint={t('auth.passwordHint')} error={shown('password')}>
          <PasswordInput autoComplete="new-password" value={values.password} onChange={set('password')} onBlur={blur('password')} />
        </FormField>
        <PasswordStrength password={values.password} />
        <Button type="submit" size="lg" loading={submitting}>{t('auth.registerButton')}</Button>
        <p className="text-xs text-fg-muted">
          <Trans i18nKey="auth.terms" components={{ 1: <Link to="/terms" className="underline" />, 3: <Link to="/privacy" className="underline" /> }} />
        </p>
      </form>
      <p className="text-center text-sm text-fg-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" state={location.state} className="font-semibold text-primary hover:underline">{t('auth.signIn')}</Link>
      </p>
    </AuthShell>
  )
}
