import { useState } from 'react'
import { useIsMobile } from '../hooks/useMediaQuery'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '8px',
  border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: '#fff',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: '600', color: '#1A2E0E', marginBottom: '6px',
}

function ContactPage() {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  document.title = 'Contact | SouqNa'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setSent(true)
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: '700', marginBottom: '10px' }}>
          Get in Touch
        </h1>
        <p style={{ color: 'rgba(247,242,232,0.7)', fontSize: '16px' }}>
          We're here to help. Send us a message and we'll respond within 24 hours.
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.6fr', gap: isMobile ? '28px' : '40px', alignItems: 'start' }}>

          {/* Contact info */}
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#1A2E0E', marginBottom: '24px' }}>
              Contact Information
            </h2>
            {[
              { icon: '📍', label: 'Location', value: 'Beirut, Lebanon' },
              { icon: '📧', label: 'Email', value: 'support@souqna.lb' },
              { icon: '📞', label: 'Phone', value: '+961 1 234 567' },
              { icon: '🕐', label: 'Working Hours', value: 'Mon–Fri, 9am–6pm' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: '#EBF2DE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#5C8A2E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{c.label}</div>
                  <div style={{ fontSize: '15px', color: '#1A2E0E' }}>{c.value}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#EBF2DE', borderRadius: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D4A1E', marginBottom: '8px' }}>WhatsApp Support</p>
              <a
                href="https://wa.me/9611234567"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#25D366', color: '#fff', textDecoration: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
              >
                💬 Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Form */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: isMobile ? '22px' : '32px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1A2E0E', marginBottom: '10px' }}>Message Sent!</h3>
                <p style={{ fontSize: '15px', color: '#4a5a3e' }}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: '#2D4A1E', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#1A2E0E', marginBottom: '4px' }}>
                  Send a Message
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'} onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'} onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Subject</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'} onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'} />
                </div>
                <div>
                  <label style={labelStyle}>Message *</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us what's on your mind..." rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'} onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'} />
                </div>
                <button type="submit" style={{ backgroundColor: '#2D4A1E', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5C8A2E'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D4A1E'}
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
