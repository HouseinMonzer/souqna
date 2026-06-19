import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const vendors = [
  { name: 'Green Valley', category: 'Organic', rating: 4.9, sales: '1.2k', initials: 'GV', color: '#4a7c59', slug: 'green-valley' },
  { name: 'Bekaa Farms', category: 'Food', rating: 5.0, sales: '980', initials: 'BF', color: '#b5620e', slug: 'bekaa-farms' },
  { name: 'TechZone LB', category: 'Tech', rating: 4.6, sales: '740', initials: 'TZ', color: '#2d6a9f', slug: 'techzone-lb' },
  { name: 'Artisan LB', category: 'Beauty', rating: 4.8, sales: '560', initials: 'AL', color: '#9b59b6', slug: 'artisan-lb' },
]

function VendorsSection() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language?.startsWith('ar')

  return (
    <section style={{ padding: '0 24px 48px' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
            {t('vendors.title')}
          </h2>
          <span
            onClick={() => navigate('/vendors')}
            style={{ fontSize: '14px', color: '#5C8A2E', cursor: 'pointer', fontWeight: '600' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {t('vendors.viewAll')}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '14px',
        }}>
          {vendors.map((v) => (
            <div
              key={v.name}
              onClick={() => navigate(`/vendors/${v.slug}`)}
              style={{
                backgroundColor: '#fff',
                border: '1.5px solid #e0dbd0',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = v.color
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e0dbd0'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: v.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '14px', flexShrink: 0,
              }}>
                {v.initials}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                  {v.name}
                </div>
                <div style={{ fontSize: '12px', color: '#7a8a6e', marginTop: '3px' }}>
                  {v.category} · {v.rating} ★ · {v.sales} sales
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default VendorsSection
