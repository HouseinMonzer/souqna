import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const s = {
  page: { backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' as const },
  card: { width: '100%', maxWidth: 460, backgroundColor: '#fff', border: '1.5px solid #e0dbd0', borderRadius: 16, padding: '40px 36px', boxSizing: 'border-box' as const, boxShadow: '0 10px 34px rgba(45,74,30,0.08)', textAlign: 'center' as const },
  logo: { fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700 },
  icon: { fontSize: 56, marginBottom: 16 },
  h1: { fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A2E0E', margin: '16px 0 8px' },
  p: { color: '#7a8a6e', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' },
  emailBadge: { display: 'inline-block', backgroundColor: '#f0f7e8', color: '#2D4A1E', padding: '6px 14px', borderRadius: 20, fontSize: 14, fontWeight: 700, marginBottom: 24 },
  divider: { border: 'none', borderTop: '1px solid #e0dbd0', margin: '24px 0' },
  btn: { display: 'inline-block', padding: '11px 24px', backgroundColor: '#5C8A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: 1 },
  btnDisabled: { opacity: 0.6, cursor: 'default' },
  success: { backgroundColor: '#f0fce8', color: '#2D4A1E', border: '1px solid #b8e08a', borderRadius: 8, padding: '11px 14px', fontSize: 14, marginBottom: 16 },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, padding: '11px 14px', fontSize: 14, marginBottom: 16 },
  small: { color: '#aaa', fontSize: 13, marginTop: 4 },
}

function VerifyPendingPage() {
  const [params] = useSearchParams()
  const email = params.get('email') || ''

  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!email || sending || cooldown > 0) return
    setSending(true)
    setSuccess('')
    setError('')
    try {
      await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSuccess('Verification email sent! Check your inbox.')
      // Start 60s countdown
      setCooldown(60)
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend. Please try again.'
      setError(msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div>
          <span style={{ ...s.logo, color: '#2D4A1E' }}>Souq</span>
          <span style={{ ...s.logo, color: '#5C8A2E' }}>na</span>
        </div>

        <div style={s.icon}>📬</div>
        <h1 style={s.h1}>Check your inbox</h1>
        <p style={s.p}>
          We've sent a verification link to:
        </p>
        {email && <div style={s.emailBadge}>{email}</div>}
        <p style={s.p}>
          Click the link in the email to activate your account. The link expires in 24 hours.
        </p>

        {success && <div role="status" style={s.success}>{success}</div>}
        {error && <div role="alert" style={s.error}>{error}</div>}

        <hr style={s.divider} />

        <p style={{ ...s.p, margin: '0 0 12px', fontSize: 14 }}>Didn't receive it? Check your spam folder, or:</p>

        <button
          onClick={handleResend}
          disabled={sending || cooldown > 0 || !email}
          style={{ ...s.btn, ...(sending || cooldown > 0 ? s.btnDisabled : {}) }}
        >
          {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </button>

        <hr style={s.divider} />

        <p style={s.small}>
          <Link to="/login" style={{ color: '#5C8A2E', fontWeight: 700, textDecoration: 'none' }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyPendingPage
