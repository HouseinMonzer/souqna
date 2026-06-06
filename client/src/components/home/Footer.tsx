import { Link } from 'react-router-dom'

const footerLinks = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Shop', to: '/shop' },
      { label: 'Categories', to: '/shop' },
      { label: 'Deals', to: '/shop?sort=price-asc' },
      { label: 'New Arrivals', to: '/shop?sort=newest' },
    ],
  },
  {
    title: 'Vendors',
    links: [
      { label: 'Sell on SouqNa', to: '/register' },
      { label: 'Vendor Dashboard', to: '/dashboard' },
      { label: 'Browse Vendors', to: '/vendors' },
      { label: 'Contact Support', to: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
]

const bottomLinks = [
  { label: 'About', to: '/about' },
  { label: 'Vendors', to: '/vendors' },
  { label: 'Contact', to: '/contact' },
]

function Footer() {
  return (
    <footer style={{ backgroundColor: '#2D4A1E', borderTop: '2px solid #5C8A2E' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 28px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px', marginBottom: '40px' }}>

          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#F7F2E8' }}>Souq</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#A3C46C' }}>na</span>
            </div>
            <p style={{ color: 'rgba(247,242,232,0.55)', fontSize: '14px', lineHeight: '1.65', fontWeight: '300', marginBottom: '16px' }}>
              Lebanon's trusted multivendor marketplace. Connecting buyers with authentic local vendors since 2024.
            </p>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 style={{ color: '#F7F2E8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                {col.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(link => (
                  <Link
                    key={link.label}
                    to={link.to}
                    style={{ color: 'rgba(247,242,232,0.55)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F7F2E8')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,242,232,0.55)')}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ color: 'rgba(247,242,232,0.4)', fontSize: '13px' }}>
            © 2025 SouqNa. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {bottomLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                style={{ color: 'rgba(247,242,232,0.4)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F7F2E8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,242,232,0.4)')}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
