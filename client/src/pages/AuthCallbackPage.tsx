import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner } from '../components/ui'
import { apiFetch } from '../lib/api'
import { postLoginPath } from '../lib/authRedirect'
import { useAuthStore } from '../store/authStore'
import type { AuthUser } from '../types/database.types'

/** Landing page after Google/Facebook sign-in: the cookie is set, so load the user and move on. */
export default function AuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setUser = useAuthStore(s => s.setUser)

  useEffect(() => {
    if (params.get('error')) {
      navigate(`/login?error=${encodeURIComponent(params.get('error')!)}`, { replace: true })
      return
    }
    apiFetch<{ user: AuthUser }>('/api/auth/me')
      .then(({ user }) => {
        setUser(user)
        navigate(postLoginPath(user), { replace: true })
      })
      .catch(() => navigate('/login?error=google', { replace: true }))
  }, [navigate, params, setUser])

  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="grid justify-items-center gap-3 text-primary">
        <Spinner size={32} />
        <p className="text-sm text-fg-muted">{t('auth.signingIn')}</p>
      </div>
    </div>
  )
}
