import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { apiFetch } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function GoogleButton() {
  return (
    <a href={`${API_URL}/api/auth/google`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', minHeight: 44, backgroundColor: '#fff', border: '1.5px solid #dadce0', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#3c4043', textDecoration: 'none', boxSizing: 'border-box' as const, marginBottom: 10 }}>
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/></svg>
      Continue with Google
    </a>
  )
}

function FacebookButton() {
  return (
    <a href={`${API_URL}/api/auth/facebook`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', minHeight: 44, backgroundColor: '#1877F2', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#fff', textDecoration: 'none', boxSizing: 'border-box' as const }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      Continue with Facebook
    </a>
  )
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Spinner() {
  return (
    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.55)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore(s => s.user)
  const signIn = useAuthStore(s => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(searchParams.get('error') === 'google' ? 'Google sign-in failed. Please try again.' : '')
  const [submitting, setSubmitting] = useState(false)
  // unverified state
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.profile?.role === 'admin') navigate('/admin', { replace: true })
    else if (user.profile?.role === 'vendor') navigate('/dashboard', { replace: true })
    else navigate('/', { replace: true })
  }, [navigate, user])

  const validate = () => {
    if (!email.trim()) return 'Email is required.'
    if (!emailPattern.test(email.trim())) return 'Enter a valid email address.'
    if (!password) return 'Password is required.'
    return ''
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setSubmitting(true)
    setError('')
    setNeedsVerification(false)
    setResendMsg('')
    try {
      const nextUser = await signIn(email.trim(), password)
      if (nextUser.profile?.role === 'admin') navigate('/admin', { replace: true })
      else if (nextUser.profile?.role === 'vendor') navigate('/dashboard', { replace: true })
      else navigate('/', { replace: true })
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      if (raw.toLowerCase().includes('verify')) {
        setNeedsVerification(true)
        setError(raw)
      } else {
        setError(raw)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || resending || resendCooldown > 0) return
    setResending(true)
    setResendMsg('')
    try {
      await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setResendMsg('Verification email sent! Check your inbox.')
      setResendCooldown(60)
      const iv = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(iv); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      setResendMsg('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }}>
      <form onSubmit={handleSubmit} noValidate style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', border: '1.5px solid #e0dbd0', borderRadius: 16, padding: '28px', boxSizing: 'border-box', boxShadow: '0 10px 34px rgba(45,74,30,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#2D4A1E' }}>Souq</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#5C8A2E' }}>na</span>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A2E0E', margin: '18px 0 6px' }}>Sign in</h1>
          <p style={{ color: '#7a8a6e', fontSize: 14, margin: 0 }}>Welcome back to Lebanon's marketplace.</p>
        </div>

        {error && (
          <div role="alert" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 13px', fontSize: 14, marginBottom: needsVerification ? 10 : 16 }}>
            {error}
          </div>
        )}

        {needsVerification && (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 14 }}>
            <p style={{ margin: '0 0 8px', color: '#92400e', fontWeight: 600 }}>Email not verified</p>
            {resendMsg
              ? <p style={{ margin: 0, color: '#5C8A2E', fontWeight: 600 }}>{resendMsg}</p>
              : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#5C8A2E', fontWeight: 700, fontSize: 14, cursor: resending || resendCooldown > 0 ? 'default' : 'pointer', opacity: resending || resendCooldown > 0 ? 0.6 : 1 }}
                >
                  {resending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email →'}
                </button>
              )
            }
          </div>
        )}

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A2E0E', marginBottom: 6 }} htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0dbd0', fontSize: 15, boxSizing: 'border-box', marginBottom: 14 }} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A2E0E', marginBottom: 6 }} htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0dbd0', fontSize: 15, boxSizing: 'border-box', marginBottom: 18 }} />

        <button type="submit" disabled={submitting} style={{ width: '100%', minHeight: 46, backgroundColor: submitting ? '#7a9d58' : '#5C8A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting && <Spinner />}
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0dbd0' }} />
          <span style={{ color: '#aaa', fontSize: 13 }}>or</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0dbd0' }} />
        </div>

        <GoogleButton />
        <FacebookButton />

        <p style={{ textAlign: 'center', color: '#7a8a6e', fontSize: 14, margin: '20px 0 0' }}>
          New here? <Link to="/register" style={{ color: '#5C8A2E', fontWeight: 700, textDecoration: 'none' }}>Register</Link>
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  )
}

export default LoginPage
