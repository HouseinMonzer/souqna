import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

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
      await signUp(email.trim(), password, name.trim())
      navigate('/dashboard', { replace: true })
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
