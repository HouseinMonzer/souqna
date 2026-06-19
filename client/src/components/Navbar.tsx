import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useIsMobile } from '../hooks/useMediaQuery'
import { toggleLanguage } from '../lib/i18n'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearch, setMobileSearch] = useState('')
  const totalItems = useCartStore(s => s.itemCount())
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isMobile = useIsMobile()
  const isRTL = i18n.language?.startsWith('ar')

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.shop'), path: '/shop' },
    { label: t('nav.vendors'), path: '/vendors' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate('/shop?search=' + encodeURIComponent(searchQuery.trim()))
      setSearchQuery('')
    }
  }

  const handleMobileSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && mobileSearch.trim()) {
      navigate('/shop?search=' + encodeURIComponent(mobileSearch.trim()))
      setMobileSearch('')
      setMenuOpen(false)
    }
  }

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const langBtn = (
    <button
      onClick={toggleLanguage}
      aria-label="Toggle language"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(163,196,108,0.35)',
        borderRadius: '6px',
        color: '#A3C46C',
        fontSize: '13px',
        fontWeight: 600,
        padding: '6px 12px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.16)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
    >
      🌐 {t('nav.language')}
    </button>
  )

  return (
    <nav style={{ backgroundColor: '#2D4A1E', borderBottom: '2px solid #5C8A2E', position: 'sticky', top: 0, zIndex: 50 }} dir={isRTL ? 'rtl' : 'ltr'}>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: '72px', gap: '16px' }}>

        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#F7F2E8' }}>Souq</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', color: '#A3C46C' }}>na</span>
        </Link>

        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: 'none', fontSize: '15px', padding: '6px 14px', borderRadius: '6px', whiteSpace: 'nowrap',
                color: location.pathname === link.path ? '#F7F2E8' : '#A3C46C',
                backgroundColor: location.pathname === link.path ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (location.pathname !== link.path) { e.currentTarget.style.color = '#F7F2E8'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' } }}
              onMouseLeave={e => { if (location.pathname !== link.path) { e.currentTarget.style.color = '#A3C46C'; e.currentTarget.style.backgroundColor = 'transparent' } }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative', minWidth: 0, display: isMobile ? 'none' : 'block' }}>
          <span style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '14px', pointerEvents: 'none' } as React.CSSProperties}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            style={{ width: '100%', padding: isRTL ? '8px 36px 8px 16px' : '8px 16px 8px 36px', borderRadius: '8px', border: '1px solid rgba(163,196,108,0.25)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#F7F2E8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'background 0.2s' }}
            onFocus={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
            onBlur={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
          />
        </form>

        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {langBtn}
          {user ? (
            <>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.profile?.full_name || user.email}
              </span>
              {user.profile?.role === 'admin' && (
                <Link to="/admin" style={{ fontSize: '13px', color: '#ffcc00', textDecoration: 'none', fontWeight: '600', padding: '5px 12px', backgroundColor: 'rgba(255,204,0,0.15)', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  ⚙ {t('nav.admin')}
                </Link>
              )}
              {(user.profile?.role === 'vendor' || user.profile?.role === 'customer') && (
                <Link to="/dashboard" style={{ fontSize: '13px', color: '#A3C46C', textDecoration: 'none', fontWeight: '600', padding: '5px 12px', backgroundColor: 'rgba(163,196,108,0.15)', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  {user.profile?.role === 'vendor' ? t('nav.dashboard') : t('nav.sell')}
                </Link>
              )}
              <button
                onClick={() => { logout(); navigate('/') }}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/sign-in" style={{ fontSize: '13px', fontWeight: '600', color: '#A3C46C', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(163,196,108,0.35)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#A3C46C')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(163,196,108,0.35)')}
              >
                {t('nav.signIn')}
              </Link>
              <Link to="/register" style={{ fontSize: '13px', fontWeight: '600', color: '#fff', textDecoration: 'none', backgroundColor: '#5C8A2E', padding: '6px 16px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4a7226')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5C8A2E')}
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => navigate('/cart')}
          style={{ flexShrink: 0, marginInlineStart: isMobile ? 'auto' : undefined, display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#F7F2E8', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.16)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
        >
          🛒 {!isMobile && t('nav.cart')}
          <span style={{ backgroundColor: totalItems > 0 ? '#5C8A2E' : 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {totalItems}
          </span>
        </button>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={t('nav.menu')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0, display: isMobile ? 'flex' : 'none', alignItems: 'center' }}
        >
          <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: 'block', height: '2px', backgroundColor: '#A3C46C', borderRadius: '2px', transition: 'all 0.25s', transform: menuOpen ? (i === 0 ? 'rotate(45deg) translate(5px, 5px)' : i === 2 ? 'rotate(-45deg) translate(5px, -5px)' : 'none') : 'none', opacity: menuOpen && i === 1 ? 0 : 1 }} />
            ))}
          </div>
        </button>

      </div>

      {isMobile && (
      <div style={{ maxHeight: menuOpen ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease', borderTop: menuOpen ? '1px solid rgba(163,196,108,0.15)' : 'none' }}>
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <span style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '14px', pointerEvents: 'none' } as React.CSSProperties}>🔍</span>
            <input
              type="text"
              placeholder={t('nav.searchPlaceholder')}
              value={mobileSearch}
              onChange={e => setMobileSearch(e.target.value)}
              onKeyDown={handleMobileSearch}
              style={{ width: '100%', padding: isRTL ? '10px 36px 10px 14px' : '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid rgba(163,196,108,0.25)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#F7F2E8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              style={{ textDecoration: 'none', fontSize: '15px', padding: '10px 14px', borderRadius: '8px', color: location.pathname === link.path ? '#F7F2E8' : '#A3C46C', backgroundColor: location.pathname === link.path ? 'rgba(255,255,255,0.12)' : 'transparent' }}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ marginTop: '8px' }}>{langBtn}</div>

          <div style={{ borderTop: '1px solid rgba(163,196,108,0.15)', marginTop: '8px', paddingTop: '8px' }}>
            {user ? (
              <>
                {user.profile?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: '#ffcc00', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}>⚙ {t('nav.admin')}</Link>
                )}
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: '#A3C46C', textDecoration: 'none', fontSize: '15px' }}>{t('nav.dashboard')}</Link>
                <Link to="/cart" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: '#A3C46C', textDecoration: 'none', fontSize: '15px' }}>🛒 {t('nav.cart')} ({totalItems})</Link>
                <button onClick={() => { logout(); navigate('/'); setMenuOpen(false) }} style={{ width: '100%', textAlign: isRTL ? 'right' : 'left', padding: '10px 14px', borderRadius: '8px', background: 'none', border: 'none', color: 'rgba(247,242,232,0.6)', fontSize: '15px', cursor: 'pointer' }}>{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/sign-in" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: '#A3C46C', textDecoration: 'none', fontSize: '15px' }}>{t('nav.signIn')}</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: '#F7F2E8', textDecoration: 'none', fontSize: '15px', backgroundColor: '#5C8A2E', textAlign: 'center', marginTop: '4px' }}>{t('nav.register')}</Link>
              </>
            )}
          </div>

        </div>
      </div>
      )}

    </nav>
  )
}

export default Navbar
