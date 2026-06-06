import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AUTH_TOKEN_KEY, apiFetch } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { AuthUser } from '../types/database.types'

type State = 'loading' | 'success' | 'error'

const s = {
  page: { backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' as const },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', border: '1.5px solid #e0dbd0', borderRadius: 16, padding: '40px 36px', boxSizing: 'border-box' as const, boxShadow: '0 10px 34px rgba(45,74,30,0.08)', textAlign: 'center' as const },
  logo: { fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700 },
  icon: { fontSize: 56, marginBottom: 12 },
  h1: { fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A2E0E', margin: '12px 0 8px' },
  p: { color: '#7a8a6e', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' },
  spinner: { width: 44, height: 44, border: '3px solid #e0dbd0', borderTopColor: '#5C8A2E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '12px auto 20px' },
  btn: { display: 'inline-block', padding: '12px 28px', backgroundColor: '#5C8A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' },
}

function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const setUser = useAuthStore(s => s.setUser)
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setState('error')
      setErrorMsg('No verification token found in the link.')
      return
    }

    apiFetch<{ token: string; user: AuthUser }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ token: jwt, user }) => {
        localStorage.setItem(AUTH_TOKEN_KEY, jwt)
        setUser(user)
        setState('success')
        // Auto-redirect after 2s
        setTimeout(() => {
          if (user.profile?.role === 'admin') navigate('/admin', { replace: true })
          else if (user.profile?.role === 'vendor') navigate('/dashboard', { replace: true })
          else navigate('/', { replace: true })
        }, 2000)
      })
      .catch((err: unknown) => {
        setState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Verification failed. The link may have expired.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.card}>
        <div>
          <span style={{ ...s.logo, color: '#2D4A1E' }}>Souq</span>
          <span style={{ ...s.logo, color: '#5C8A2E' }}>na</span>
        </div>

        {state === 'loading' && (
          <>
            <div style={s.spinner} />
            <h1 style={s.h1}>Verifying your email…</h1>
            <p style={s.p}>Please wait a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={s.icon}>✅</div>
            <h1 style={s.h1}>Email verified!</h1>
            <p style={s.p}>Your account is active. Redirecting you now…</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={s.icon}>❌</div>
            <h1 style={{ ...s.h1, color: '#991b1b' }}>Verification failed</h1>
            <p style={s.p}>{errorMsg}</p>
            <a href="/login" style={s.btn}>Back to sign in</a>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
