import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

function HeroSection() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  return (
    <section style={{ backgroundColor: '#2D4A1E', padding: '56px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '280px', height: '280px', borderRadius: '50%', backgroundColor: 'rgba(92,138,46,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '80px', top: '20px', width: '160px', height: '160px', borderRadius: '50%', backgroundColor: 'rgba(92,138,46,0.06)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: '260px' }}>
          <p style={{ color: '#A3C46C', fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '14px' }}>
            🇱🇧 Lebanon's Marketplace
          </p>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: '700', lineHeight: '1.15', marginBottom: '16px' }}>
            Shop Local,<br />Shop{' '}
            <span style={{ color: '#A3C46C', fontStyle: 'italic' }}>Fresh</span>
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.75)', fontSize: '16px', lineHeight: '1.65', maxWidth: '400px', marginBottom: '32px', fontWeight: '300' }}>
            Discover authentic products from verified Lebanese vendors near you.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/shop')}
              style={{ backgroundColor: '#5C8A2E', color: '#F7F2E8', border: 'none', borderRadius: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(92,138,46,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(92,138,46,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(92,138,46,0.4)' }}
            >
              Browse Shop →
            </button>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              style={{ backgroundColor: 'transparent', color: '#F7F2E8', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Become a Vendor
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(92,138,46,0.15)', border: '1px solid rgba(163,196,108,0.4)', borderRadius: '16px', padding: '28px 36px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '48px', fontWeight: '700', color: '#A3C46C', fontFamily: 'Georgia, serif' }}>120+</div>
          <div style={{ color: 'rgba(247,242,232,0.65)', fontSize: '14px', marginTop: '4px' }}>Active Vendors</div>
        </div>

      </div>
    </section>
  )
}

export default HeroSection
