import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Footer() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language?.startsWith('ar')

  const footerLinks = [
    {
      title: t('footer.marketplace'),
      links: [
        { label: t('footer.shop'), to: '/shop' },
        { label: t('footer.categories'), to: '/shop' },
        { label: t('footer.deals'), to: '/shop?sort=price-asc' },
        { label: t('footer.newArrivals'), to: '/shop?sort=newest' },
      ],
    },
    {
      title: t('footer.vendorsCol'),
      links: [
        { label: t('footer.sell'), to: '/register' },
        { label: t('footer.dashboard'), to: '/dashboard' },
        { label: t('footer.browse'), to: '/vendors' },
        { label: t('footer.support'), to: '/contact' },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.about'), to: '/about' },
        { label: t('footer.contact'), to: '/contact' },
        { label: t('footer.privacy'), to: '/privacy' },
        { label: t('footer.terms'), to: '/terms' },
      ],
    },
  ]

  const bottomLinks = [
    { label: t('footer.about'), to: '/about' },
    { label: t('footer.vendorsCol'), to: '/vendors' },
    { label: t('footer.contact'), to: '/contact' },
  ]

  return (
    <footer style={{ backgroundColor: '#2D4A1E', borderTop: '2px solid #5C8A2E' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 28px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px', marginBottom: '40px' }}>

          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#F7F2E8' }}>Souq</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#A3C46C' }}>na</span>
            </div>
            <p style={{ color: 'rgba(247,242,232,0.55)', fontSize: '14px', lineHeight: '1.65', fontWeight: '300', marginBottom: '16px' }}>
              {t('footer.rights')}
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
            {t('footer.rights')}
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
