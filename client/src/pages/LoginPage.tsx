import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { useAuthStore } from '../store/authStore'

function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError('Please fill all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await loginUser(form.email, form.password)
      if (res?.user) {
        setAuth(res.user, res.session?.access_token)
        if (res.user.role === 'VENDOR') {
          navigate('/dashboard')
        } else {
          navigate('/')
        }
      } else {
        setError(res?.error?.message || 'Login failed')
      }
    } catch (error: any) {
      setError(error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: '#F7F2E8', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px',
        border: '1.5px solid #e0dbd0', padding: '40px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#2D4A1E' }}>Souq</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#5C8A2E' }}>na</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1A2E0E', marginBottom: '4px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: '#7a8a6e' }}>Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fce4ec', color: '#c62828',
            borderRadius: '8px', padding: '12px 16px',
            fontSize: '14px', marginBottom: '20px',
            border: '1px solid #ef9a9a',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: '8px',
                border: '1.5px solid #e0dbd0', fontSize: '14px',
                color: '#1A2E0E', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
              onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: '8px',
                border: '1.5px solid #e0dbd0', fontSize: '14px',
                color: '#1A2E0E', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
              onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#7a8a6e' : '#2D4A1E',
              color: '#fff', border: 'none', borderRadius: '8px',
              padding: '13px', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s', marginTop: '4px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#5C8A2E' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#2D4A1E' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#7a8a6e', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#5C8A2E', fontWeight: '600', textDecoration: 'none' }}>
            Register
          </Link>
        </p>

      </div>
    </div>
  )
}

export default LoginPage