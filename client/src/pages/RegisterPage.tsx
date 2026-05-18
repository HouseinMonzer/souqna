import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api/auth'
import { useAuthStore } from '../store/authStore'

function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'BUYER' as 'BUYER' | 'VENDOR',
    category: '', location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Please fill all fields')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    const role = form.role === 'VENDOR' ? 'vendor' : 'customer'
    try {
      const res = await registerUser(form.email, form.password, form.name, role)
      if (res?.user) {
        setAuth(res.user, res.session?.access_token)
        if (role === 'vendor') {
          navigate('/dashboard')
        } else {
          navigate('/')
        }
      } else {
        setError(res?.error?.message || 'Registration failed')
      }
    } catch (error: any) {
      setError(error?.message || 'Registration failed')
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
        width: '100%', maxWidth: '460px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#2D4A1E' }}>Souq</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#5C8A2E' }}>na</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1A2E0E', marginBottom: '4px' }}>
            Create account
          </h1>
          <p style={{ fontSize: '14px', color: '#7a8a6e' }}>Join Lebanon's marketplace</p>
        </div>

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(['BUYER', 'VENDOR'] as const).map(r => (
              <button
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                style={{
                  padding: '10px', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                  border: form.role === r ? 'none' : '1.5px solid #e0dbd0',
                  backgroundColor: form.role === r ? '#2D4A1E' : '#fff',
                  color: form.role === r ? '#fff' : '#1A2E0E',
                }}
              >
                {r === 'BUYER' ? '🛒 Buyer' : '🏪 Vendor'}
              </button>
            ))}
          </div>

          {/* Fields */}
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Ahmad Hassan' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
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
          ))}

          {/* Vendor extra fields */}
          {form.role === 'VENDOR' && (
            <>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '8px',
                    border: '1.5px solid #e0dbd0', fontSize: '14px',
                    color: '#1A2E0E', outline: 'none', boxSizing: 'border-box',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="">Select category</option>
                  {['Organic', 'Food', 'Electronics', 'Beauty', 'Home', 'Fashion'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Beirut, Lebanon"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '8px',
                    border: '1.5px solid #e0dbd0', fontSize: '14px',
                    color: '#1A2E0E', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
                />
              </div>
            </>
          )}

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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#7a8a6e', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#5C8A2E', fontWeight: '600', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default RegisterPage