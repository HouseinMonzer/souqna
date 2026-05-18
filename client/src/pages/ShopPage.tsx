import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#A3C46C' : '#d4cfc0', fontSize: '12px' }}>★</span>
      ))}
    </span>
  )
}

function ShopPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch categories
  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Fetch products
  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, product_images(image_url, is_primary), vendors(store_name, slug), categories(name)')
      .eq('status', 'active')
      .eq('approval_status', 'approved')

    if (activeCategory) query = query.eq('category_id', activeCategory)
    if (search) query = query.ilike('name', `%${search}%`)

    if (sortBy === 'price-asc') query = query.order('price', { ascending: true })
    else if (sortBy === 'price-desc') query = query.order('price', { ascending: false })
    else if (sortBy === 'rating') query = query.order('rating', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    query.then(({ data }) => {
      setProducts(data ?? [])
      setLoading(false)
    })
  }, [activeCategory, search, sortBy])

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '36px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>
            Shop
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '15px' }}>
            {loading ? 'Loading...' : `${products.length} products available`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Search + Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#7a8a6e' }}>🔍</span>
            <input
              type="text"
              placeholder="Search products..."
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
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: '8px',
              border: '1.5px solid #e0dbd0', backgroundColor: '#fff',
              fontSize: '14px', color: '#1A2E0E', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="default">Sort: Newest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: '8px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '500',
              cursor: 'pointer', border: !activeCategory ? 'none' : '1.5px solid #e0dbd0',
              backgroundColor: !activeCategory ? '#2D4A1E' : '#fff',
              color: !activeCategory ? '#F7F2E8' : '#1A2E0E',
            }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '8px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', border: activeCategory === cat.id ? 'none' : '1.5px solid #e0dbd0',
                backgroundColor: activeCategory === cat.id ? '#2D4A1E' : '#fff',
                color: activeCategory === cat.id ? '#F7F2E8' : '#1A2E0E',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7a8a6e' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7a8a6e' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1A2E0E', marginBottom: '8px' }}>No products found</p>
            <p style={{ fontSize: '14px' }}>Try a different search or category</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: '#7a8a6e', marginBottom: '20px' }}>
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {products.map((product: any) => {
                const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url
                  || product.product_images?.[0]?.image_url
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.slug}`)}
                    style={{
                      backgroundColor: '#fff', border: '1.5px solid #e0dbd0',
                      borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: '160px', backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>
                      {primaryImage
                        ? <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🛍️'
                      }
                    </div>
                    <div style={{ padding: '14px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#5C8A2E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        {product.vendors?.store_name}
                      </p>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E', marginBottom: '6px', lineHeight: '1.3', fontFamily: 'Georgia, serif' }}>
                        {product.name}
                      </h3>
                      {product.short_description && (
                        <p style={{ fontSize: '13px', color: '#7a8a6e', marginBottom: '10px', lineHeight: '1.5' }}>
                          {product.short_description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                        <Stars rating={Number(product.rating)} />
                        <span style={{ fontSize: '12px', color: '#7a8a6e' }}>({product.total_reviews})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <button
                          onClick={e => e.stopPropagation()}
                          style={{
                            backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
                            borderRadius: '8px', padding: '9px 18px', fontSize: '13px',
                            fontWeight: '600', cursor: 'pointer',
                          }}
                        >
                          + Cart
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ShopPage