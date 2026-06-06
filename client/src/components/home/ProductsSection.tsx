import { useNavigate } from 'react-router-dom'

const products = [
  { id: 1, name: 'Organic Olive Oil 500ml', vendor: 'Green Valley', price: 12.00, rating: 4.9, reviews: 142, emoji: '🫒', badge: 'Bestseller' },
  { id: 2, name: 'Wireless Headphones Pro', vendor: 'TechZone LB', price: 45.00, rating: 4.6, reviews: 89, emoji: '🎧', badge: 'New' },
  { id: 3, name: "Za'atar Mix Traditional", vendor: 'Bekaa Farms', price: 8.50, rating: 5.0, reviews: 201, emoji: '🌿', badge: 'Top Rated' },
  { id: 4, name: 'Lebanese Cedar Soap', vendor: 'Artisan LB', price: 6.00, rating: 4.8, reviews: 77, emoji: '🧼', badge: null },
  { id: 5, name: 'Handwoven Kilim Pillow', vendor: 'Craft House', price: 28.00, rating: 4.7, reviews: 53, emoji: '🪔', badge: 'Handmade' },
  { id: 6, name: 'Sumac Spice Pack 200g', vendor: 'Bekaa Farms', price: 4.50, rating: 4.9, reviews: 318, emoji: '🫙', badge: 'Deal' },
]

const badgeColors: Record<string, { bg: string; color: string }> = {
  Bestseller: { bg: '#fff3e0', color: '#e65100' },
  New:        { bg: '#e3f2fd', color: '#0d47a1' },
  'Top Rated':{ bg: '#e8f5e9', color: '#1b5e20' },
  Handmade:   { bg: '#f3e5f5', color: '#4a148c' },
  Deal:       { bg: '#fce4ec', color: '#880e4f' },
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#A3C46C' : '#d4cfc0', fontSize: '12px' }}>★</span>
      ))}
    </span>
  )
}

function ProductsSection() {
  const navigate = useNavigate()

  return (
    <section style={{ padding: '0 24px 48px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
            Featured products
          </h2>
          <span
            onClick={() => navigate('/shop')}
            style={{ fontSize: '14px', color: '#5C8A2E', cursor: 'pointer', fontWeight: '600' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            View all →
          </span>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '18px',
        }}>
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate('/shop')}
              style={{
                backgroundColor: '#fff',
                border: '1.5px solid #e0dbd0',
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Image area */}
              <div style={{
                height: '150px', backgroundColor: '#EBF2DE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '56px', position: 'relative',
              }}>
                {p.emoji}
                {p.badge && (
                  <span style={{
                    position: 'absolute', top: '10px', left: '10px',
                    fontSize: '10px', fontWeight: '600', padding: '3px 8px',
                    borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em',
                    backgroundColor: badgeColors[p.badge]?.bg,
                    color: badgeColors[p.badge]?.color,
                  }}>
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#5C8A2E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  {p.vendor}
                </p>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E', marginBottom: '8px', lineHeight: '1.3', fontFamily: 'Georgia, serif' }}>
                  {p.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <Stars rating={p.rating} />
                  <span style={{ fontSize: '12px', color: '#7a8a6e' }}>{p.rating} ({p.reviews})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                    ${p.price.toFixed(2)}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/shop') }}
                    style={{
                      backgroundColor: '#2D4A1E', color: '#fff',
                      border: 'none', borderRadius: '8px',
                      padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5C8A2E'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D4A1E'}
                  >
                    + Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default ProductsSection
