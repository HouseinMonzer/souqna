import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#A3C46C' : '#d4cfc0', fontSize: '16px' }}>★</span>
      ))}
    </span>
  )
}

function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)

    supabase
      .from('products')
      .select('*, product_images(*), product_variants(*), vendors(id, store_name, slug, logo_url, rating, verified, location), categories(id, name, slug)')
      .eq('slug', slug)
      .single()
      .then(({ data }: any) => {
        setProduct(data)
        const primary = (data as any)?.product_images?.find((img: any) => img.is_primary)?.image_url
          || (data as any)?.product_images?.[0]?.image_url
        setSelectedImage(primary ?? null)

        // Fetch related
        if (data?.category_id) {
          supabase
            .from('products')
            .select('*, product_images(image_url, is_primary)')
            .eq('category_id', data.category_id)
            .eq('status', 'active')
            .neq('id', data.id)
            .limit(3)
            .then(({ data: rel }: any) => setRelated(rel ?? []))
        }
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#7a8a6e', fontSize: '16px' }}>Loading...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
        <h2 style={{ fontSize: '24px', color: '#1A2E0E', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>Product not found</h2>
        <button onClick={() => navigate('/shop')} style={{ backgroundColor: '#2D4A1E', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' }}>
          ← Back to Shop
        </button>
      </div>
    )
  }

  const images = product.product_images ?? []

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e0dbd0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#7a8a6e' }}>
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#5C8A2E' }}>Home</span>
            <span>›</span>
            <span onClick={() => navigate('/shop')} style={{ cursor: 'pointer', color: '#5C8A2E' }}>Shop</span>
            <span>›</span>
            <span style={{ color: '#1A2E0E' }}>{product.name}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '64px' }}>

          {/* Images */}
          <div>
            <div style={{
              backgroundColor: '#EBF2DE', borderRadius: '16px', height: '380px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '120px', overflow: 'hidden', marginBottom: '12px',
            }}>
              {selectedImage
                ? <img src={selectedImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🛍️'
              }
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.map((img: any) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    style={{
                      width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden',
                      cursor: 'pointer', border: selectedImage === img.image_url ? '2px solid #5C8A2E' : '2px solid transparent',
                    }}
                  >
                    <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#5C8A2E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {product.vendors?.store_name}
            </span>

            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '700', color: '#1A2E0E', lineHeight: '1.2' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Stars rating={Number(product.rating)} />
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E' }}>{Number(product.rating).toFixed(1)}</span>
              <span style={{ fontSize: '14px', color: '#7a8a6e' }}>({product.total_reviews} reviews)</span>
            </div>

            <div style={{ fontSize: '36px', fontWeight: '700', color: '#2D4A1E', fontFamily: 'Georgia, serif' }}>
              ${Number(product.price).toFixed(2)}
              {product.compare_price && (
                <span style={{ fontSize: '20px', color: '#7a8a6e', textDecoration: 'line-through', marginLeft: '12px' }}>
                  ${Number(product.compare_price).toFixed(2)}
                </span>
              )}
            </div>

            {product.short_description && (
              <p style={{ fontSize: '16px', color: '#4a5a3e', lineHeight: '1.7', paddingBottom: '20px', borderBottom: '1px solid #e0dbd0' }}>
                {product.short_description}
              </p>
            )}

            {product.categories && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', color: '#7a8a6e' }}>Category:</span>
                <span style={{ backgroundColor: '#EBF2DE', color: '#2D4A1E', fontSize: '13px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
                  {product.categories.name}
                </span>
              </div>
            )}

            {/* Stock */}
            <div style={{ fontSize: '14px', color: product.stock > 0 ? '#5C8A2E' : '#e53e3e' }}>
              {product.stock > 0 ? `✓ In stock (${product.stock} available)` : '✗ Out of stock'}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 1500) }}
                disabled={product.stock === 0}
                style={{
                  flex: 1, backgroundColor: added ? '#5C8A2E' : '#2D4A1E',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '15px 24px', fontSize: '16px', fontWeight: '600',
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  opacity: product.stock === 0 ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(45,74,30,0.3)',
                }}
              >
                {added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
              </button>
              <button style={{
                backgroundColor: '#fff', color: '#2D4A1E',
                border: '1.5px solid #e0dbd0', borderRadius: '10px',
                padding: '15px 20px', fontSize: '20px', cursor: 'pointer',
              }}>
                ♡
              </button>
            </div>

            {/* Vendor info */}
            {product.vendors && (
              <div
                onClick={() => navigate(`/store/${product.vendors.slug}`)}
                style={{
                  marginTop: '8px', padding: '16px', borderRadius: '10px',
                  border: '1.5px solid #e0dbd0', backgroundColor: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: '700', color: '#2D4A1E', fontSize: '14px',
                }}>
                  {product.vendors.store_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E' }}>
                    {product.vendors.store_name}
                    {product.vendors.verified && <span style={{ color: '#5C8A2E', marginLeft: '6px' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7a8a6e' }}>★ {Number(product.vendors.rating).toFixed(1)} · Visit Store →</div>
                </div>
              </div>
            )}

            <button onClick={() => navigate('/shop')} style={{ backgroundColor: 'transparent', color: '#7a8a6e', border: 'none', fontSize: '14px', cursor: 'pointer', textAlign: 'left', padding: '0' }}>
              ← Back to Shop
            </button>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div style={{ marginBottom: '48px', backgroundColor: '#fff', borderRadius: '12px', padding: '28px', border: '1.5px solid #e0dbd0' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#1A2E0E', marginBottom: '16px' }}>Description</h2>
            <p style={{ fontSize: '15px', color: '#4a5a3e', lineHeight: '1.8' }}>{product.description}</p>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#1A2E0E', marginBottom: '24px' }}>
              Related Products
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
              {related.map((p: any) => {
                const img = p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/product/${p.slug}`)}
                    style={{ backgroundColor: '#fff', border: '1.5px solid #e0dbd0', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: '120px', backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      {img ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛍️'}
                    </div>
                    <div style={{ padding: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>{p.name}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>${Number(p.price).toFixed(2)}</span>
                        <span style={{ fontSize: '12px', color: '#A3C46C' }}>★ {Number(p.rating).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ProductPage