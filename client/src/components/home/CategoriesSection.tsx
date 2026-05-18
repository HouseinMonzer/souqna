const categories = [
  { name: 'Organic', count: 340, emoji: '🌿', color: '#4a7c59' },
  { name: 'Electronics', count: 210, emoji: '💻', color: '#2d6a9f' },
  { name: 'Fashion', count: 180, emoji: '👗', color: '#8b5e83' },
  { name: 'Home', count: 95, emoji: '🏡', color: '#b5620e' },
  { name: 'Food', count: 270, emoji: '🥙', color: '#c0392b' },
  { name: 'Beauty', count: 130, emoji: '✨', color: '#9b59b6' },
]

function CategoriesSection() {
  return (
    <section style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
            Browse categories
          </h2>
          <span style={{ fontSize: '14px', color: '#5C8A2E', cursor: 'pointer' }}>See all →</span>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
        }}>
          {categories.map((cat) => (
            <div
              key={cat.name}
              style={{
                backgroundColor: '#fff',
                border: '1.5px solid #e0dbd0',
                borderRadius: '12px',
                padding: '22px 14px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = cat.color
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.08)`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e0dbd0'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: '#EBF2DE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', fontSize: '22px',
              }}>
                {cat.emoji}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', marginBottom: '4px' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: '12px', color: '#7a8a6e' }}>
                {cat.count} items
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default CategoriesSection