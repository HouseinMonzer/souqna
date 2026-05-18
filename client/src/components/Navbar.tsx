import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop' },
  { label: 'Vendors', path: '/vendors' },
  { label: 'Deals', path: '/deals' },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate() 
  const [menuOpen, setMenuOpen] = useState(false)
  const totalItems = useCartStore(s => s.itemCount()) 
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  return (
    <nav style={{ backgroundColor: '#2D4A1E', borderBottom: '2px solid #5C8A2E' }} className="sticky top-0 z-50">

      {/* Desktop & Mobile bar */}
      <div style={{ maxWidth: '2800px', margin: '0 auto', padding: '0 24px' }}
        className="flex items-center h-20 gap-8">

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#F7F2E8' }}>Souq</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#A3C46C' }}>na</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              style={{
                textDecoration: 'none',
                fontSize: '18px',
                padding: '6px 14px',
                borderRadius: '6px',
                color: location.pathname === link.path ? '#F7F2E8' : '#A3C46C',
                backgroundColor: location.pathname === link.path ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.color = '#F7F2E8'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                }
              }}
              onMouseLeave={e => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.color = '#A3C46C'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search — Desktop */}
        <div className="hidden md:block flex-1 relative">
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '14px', pointerEvents: 'none'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search products, vendors..."
            style={{
              width: '100%',
              padding: '9px 16px 9px 36px',
              borderRadius: '8px',
              border: '0.5px solid rgba(163,196,108,0.3)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#F7F2E8',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onBlur={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
          />
        </div>
{user ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
      {user.name}
    </span>
    {user.role === 'VENDOR' && (
      <Link to="/dashboard"
        style={{ fontSize: '13px', color: '#A3C46C', textDecoration: 'none', fontWeight: '600' }}>
        Dashboard
      </Link>
    )}
    <button
      onClick={() => { logout(); navigate('/') }}
      style={{
        background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)',
        borderRadius: '6px', color: '#fff', fontSize: '13px',
        padding: '6px 12px', cursor: 'pointer',
      }}
    >
      Logout
    </button>
  </div>
) : (
  <Link to="/login"
    style={{
      fontSize: '13px', fontWeight: '600', color: '#fff', textDecoration: 'none',
      backgroundColor: '#5C8A2E', padding: '7px 16px', borderRadius: '6px',
    }}
  >
    Sign In
  </Link>
)}
        {/* Cart */}
        <button
  onClick={() => navigate('/cart')}   // ← أضف onClick
  style={{
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '0.5px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#F7F2E8',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  }}
  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'}
  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
>
  🛒
  <span className="hidden sm:inline" style={{ fontSize: '14px' }}>Cart</span>
  <span style={{
    backgroundColor: totalItems > 0 ? '#5C8A2E' : 'rgba(255,255,255,0.2)',
    color: '#fff',
    borderRadius: '50%',
    width: '20px', height: '20px',
    fontSize: '11px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.3s',
  }}>
    {totalItems}
  </span>
</button>
        {/* Hamburger — Mobile only */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: 'auto' }}
        >
          <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block',
                height: '2px',
                backgroundColor: '#A3C46C',
                borderRadius: '2px',
                transition: 'all 0.25s',
                transform: menuOpen
                  ? i === 0 ? 'rotate(45deg) translate(5px, 5px)'
                  : i === 2 ? 'rotate(-45deg) translate(5px, -5px)'
                  : 'none'
                  : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </div>
        </button>

      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className="md:hidden"
        style={{
          maxHeight: menuOpen ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          borderTop: menuOpen ? '0.5px solid rgba(163,196,108,0.2)' : 'none',
        }}
      >
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

          {/* Mobile Search */}
          <input
            type="text"
            placeholder="Search products..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '0.5px solid rgba(163,196,108,0.3)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#F7F2E8',
              fontSize: '14px',
              outline: 'none',
              marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />

          {/* Mobile Links */}
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              style={{
                textDecoration: 'none',
                fontSize: '15px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: location.pathname === link.path ? '#F7F2E8' : '#A3C46C',
                backgroundColor: location.pathname === link.path ? 'rgba(255,255,255,0.12)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

        </div>
      </div>

    </nav>
  )
}

export default Navbar