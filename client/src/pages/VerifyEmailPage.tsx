import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleCheckBig, CircleX } from 'lucide-react'
import { Button, Spinner } from '../components/ui'
import { AuthShell } from '../components/auth/AuthShell'
import { apiFetch } from '../lib/api'
import { postLoginPath } from '../lib/authRedirect'
import { useAuthStore } from '../store/authStore'
import { usePageTitle } from '../hooks/usePageTitle'
import type { AuthUser } from '../types/database.types'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setUser = useAuthStore(s => s.setUser)
  const [state, setState] = useState<'verifying' | 'done' | 'failed'>('verifying')
  const started = useRef(false)
  usePageTitle(t(state === 'failed' ? 'auth.verifyFailed' : state === 'done' ? 'auth.verified' : 'auth.verifying'))

  useEffect(() => {
    // Tokens are single-use, so guard against StrictMode's double effect.
    if (started.current) return
    started.current = true
    const token = params.get('token')
    if (!token) { setState('failed'); return }
    apiFetch<{ user: AuthUser }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ user }) => {
        setUser(user)
        setState('done')
        setTimeout(() => navigate(postLoginPath(user), { replace: true }), 1200)
      })
      .catch(() => setState('failed'))
  }, [params, navigate, setUser])

  return (
    <AuthShell title={t(state === 'failed' ? 'auth.verifyFailed' : state === 'done' ? 'auth.verified' : 'auth.verifying')}>
      {state === 'verifying' && <Spinner size={32} className="text-primary" label={t('auth.verifying')} />}
      {state === 'done' && <CircleCheckBig aria-hidden className="size-12 text-success" />}
      {state === 'failed' && (
        <div className="grid gap-4">
          <CircleX aria-hidden className="size-12 text-danger" />
          <p className="text-fg-muted">{t('auth.verifyFailedText')}</p>
          <Button asChild className="w-fit"><Link to="/login">{t('auth.backToLogin')}</Link></Button>
        </div>
      )}
    </AuthShell>
  )
}
