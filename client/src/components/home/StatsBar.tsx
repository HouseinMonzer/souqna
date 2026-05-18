const stats = [
  { val: '2.4k', label: 'Products' },
  { val: '120', label: 'Vendors' },
  { val: '98%', label: 'Satisfaction' },
  { val: 'Fast', label: 'Delivery' },
]

function StatsBar() {
  return (
    <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e0dbd0' }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '0 24px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: '20px 0', textAlign: 'center',
            borderRight: i < 3 ? '1px solid #e0dbd0' : 'none',
          }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#2D4A1E', fontFamily: 'Georgia, serif' }}>
              {s.val}
            </div>
            <div style={{ fontSize: '13px', color: '#7a8a6e', marginTop: '2px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsBar