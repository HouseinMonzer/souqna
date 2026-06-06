import { useState, useEffect, useMemo, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchVendors, type VendorType } from '../api/vendors'
import { sampleVendors } from '../data/sampleData'
import { Skeleton } from '../components/ui'

const categories = ['All', 'Organic', 'Food', 'Electronics', 'Beauty', 'Home']

function VendorCard({ vendor }: { vendor: VendorType }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => navigate(`/vendors/${vendor.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#fff',
        border: `1.5px solid ${hovered ? vendor.color : '#e0dbd0'}`,
        borderRadius: '14px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          backgroundColor: vendor.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '700', fontSize: '16px', flexShrink: 0,
        }}>
          {vendor.initials}
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
            {vendor.name}
          </h3>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '2px 10px',
            borderRadius: '20px', backgroundColor: '#EBF2DE', color: '#2D4A1E',
          }}>
            {vendor.category}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#7a8a6e', lineHeight: '1.6', marginBottom: '16px' }}>
        {vendor.description || 'Lebanese vendor on SouQna'}
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px', paddingTop: '16px', borderTop: '1px solid #e0dbd0',
      }}>
        {[
          { label: 'Rating', val: vendor.rating > 0 ? `⭐ ${vendor.rating}` : 'New' },
          { label: 'Sales', val: vendor.sales || 0 },
          { label: 'Products', val: vendor.products },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
              {s.val}
            </div>
            <div style={{ fontSize: '11px', color: '#7a8a6e', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '12px', color: '#7a8a6e' }}>
        <span>📍 {vendor.location}</span>
        <span>Since {vendor.joined}</span>
      </div>
    </div>
  )
}

function VendorsPage() {
  document.title = 'Vendors | SouqNa'
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [vendors, setVendors] = useState<VendorType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendors().then((data: SetStateAction<VendorType[]>) => {
      setVendors(data && data.length > 0 ? data : sampleVendors)
      setLoading(false)
    }).catch(() => {
      setVendors(sampleVendors)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let result = [...vendors]
    if (activeCategory !== 'All') result = result.filter(v => v.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
      )
    }
    return result
  }, [vendors, activeCategory, search])

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#2D4A1E', padding: '36px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>
            Our Vendors
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '15px' }}>
            {loading ? 'Loading...' : `${vendors.length} verified vendors across Lebanon`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#7a8a6e', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px 10px 36px',
              borderRadius: '8px', border: '1.5px solid #e0dbd0',
              backgroundColor: '#fff', fontSize: '14px', color: '#1A2E0E',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
            onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 18px', borderRadius: '20px', fontSize: '14px',
                fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                border: activeCategory === cat ? 'none' : '1.5px solid #e0dbd0',
                backgroundColor: activeCategory === cat ? '#2D4A1E' : '#fff',
                color: activeCategory === cat ? '#F7F2E8' : '#1A2E0E',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0', padding: '24px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                  <Skeleton width={52} height={52} borderRadius={26} />
                  <div style={{ flex: 1 }}><Skeleton height={18} width="70%" style={{ marginBottom: '8px' }} /><Skeleton height={14} width="40%" /></div>
                </div>
                <Skeleton height={14} style={{ marginBottom: '6px' }} /><Skeleton height={14} width="80%" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7a8a6e' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <p style={{ fontSize: '18px', color: '#1A2E0E', fontWeight: '600', marginBottom: '8px' }}>No vendors found</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: '#7a8a6e', marginBottom: '20px' }}>
              Showing {filtered.length} vendor{filtered.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {filtered.map(vendor => <VendorCard key={vendor.id} vendor={vendor} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default VendorsPage