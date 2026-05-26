import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Spinner() {
  return (
    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.55)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const signIn = useAuthStore(s => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const nextUser = await signIn(email.trim(), password)
      if (nextUser.profile?.role === 'admin') navigate('/admin', { replace: true })
      else if (nextUser.profile?.role === 'vendor') navigate('/dashboard', { replace: true })
      else navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
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
          <div role="alert" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 13px', fontSize: 14, marginBottom: 16 }}>
            {error}
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

        <p style={{ textAlign: 'center', color: '#7a8a6e', fontSize: 14, margin: '20px 0 0' }}>
          New here? <Link to="/register" style={{ color: '#5C8A2E', fontWeight: 700, textDecoration: 'none' }}>Register</Link>
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  )
}

export default LoginPage
