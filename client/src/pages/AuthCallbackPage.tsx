import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { AuthUser } from '../types/database.types'

function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)

  useEffect(() => {
    const error = params.get('error')

    if (error) {
      navigate('/login?error=google', { replace: true })
      return
    }

    // Cookie was set server-side — just fetch the user profile
    apiFetch<{ user: AuthUser }>('/api/auth/me')
      .then(({ user }) => {
        setUser(user)
        if (user.profile?.role === 'admin') navigate('/admin', { replace: true })
        else if (user.profile?.role === 'vendor') navigate('/dashboard', { replace: true })
        else navigate('/', { replace: true })
      })
      .catch(() => {
        navigate('/login?error=google', { replace: true })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #e0dbd0', borderTopColor: '#5C8A2E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#7a8a6e', fontSize: 15 }}>Signing you in…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default AuthCallbackPage
