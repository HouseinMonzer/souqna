import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

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

function RegisterPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const signUp = useAuthStore(s => s.signUp)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [navigate, user])

  const validate = () => {
    if (!name.trim()) return 'Name is required.'
    if (name.trim().length < 2) return 'Name must be at least 2 characters.'
    if (!email.trim()) return 'Email is required.'
    if (!emailPattern.test(email.trim())) return 'Enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
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
      const result = await signUp(email.trim(), password, name.trim())
      // Server now requires email verification before login
      if ((result as unknown as { needsVerification?: boolean }).needsVerification) {
        navigate(`/verify-pending?email=${encodeURIComponent(email.trim())}`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }}>
      <form onSubmit={handleSubmit} noValidate style={{ width: '100%', maxWidth: 500, backgroundColor: '#fff', border: '1.5px solid #e0dbd0', borderRadius: 16, padding: '28px', boxSizing: 'border-box', boxShadow: '0 10px 34px rgba(45,74,30,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#2D4A1E' }}>Souq</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#5C8A2E' }}>na</span>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A2E0E', margin: '18px 0 6px' }}>Create account</h1>
          <p style={{ color: '#7a8a6e', fontSize: 14, margin: 0 }}>Create your free marketplace account.</p>
        </div>

        {error && (
          <div role="alert" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 13px', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A2E0E', marginBottom: 6 }} htmlFor="name">Name</label>
        <input id="name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0dbd0', fontSize: 15, boxSizing: 'border-box', marginBottom: 14 }} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A2E0E', marginBottom: 6 }} htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0dbd0', fontSize: 15, boxSizing: 'border-box', marginBottom: 14 }} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A2E0E', marginBottom: 6 }} htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0dbd0', fontSize: 15, boxSizing: 'border-box', marginBottom: 14 }} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A2E0E', marginBottom: 6 }} htmlFor="confirm-password">Confirm password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          style={{ width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0dbd0', fontSize: 15, boxSizing: 'border-box', marginBottom: 18 }} />

        <button type="submit" disabled={submitting} style={{ width: '100%', minHeight: 46, backgroundColor: submitting ? '#7a9d58' : '#5C8A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting && <Spinner />}
          {submitting ? 'Creating account...' : 'Register'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0dbd0' }} />
          <span style={{ color: '#aaa', fontSize: 13 }}>or</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0dbd0' }} />
        </div>

        <GoogleButton />
        <FacebookButton />

        <p style={{ textAlign: 'center', color: '#7a8a6e', fontSize: 14, margin: '20px 0 0' }}>
          Already have an account? <Link to="/sign-in" style={{ color: '#5C8A2E', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#7a8a6e', lineHeight: 1.6 }}>
          After registering, go to your <strong style={{ color: '#2D4A1E' }}>Dashboard</strong> to set up your vendor store.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  )
}

export default RegisterPage
