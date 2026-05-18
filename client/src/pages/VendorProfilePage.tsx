import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Vendor, Product } from '../types/database.types'

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#A3C46C' : '#d4cfc0', fontSize: '13px' }}>★</span>
      ))}
    </span>
  )
}

function VendorProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single()

      const { data: productsData } = await supabase
        .from('products')
        .select('*, product_images(image_url, is_primary)')
        .eq('vendor_id', id)
        .eq('status', 'active')
        .eq('approval_status', 'approved')

      setVendor(vendorData)
      setProducts(productsData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
    // TODO: ربط مع cartStore بعدين
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
        <div style={{ fontSize: '32px', color: '#5C8A2E' }}>Loading...</div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
        <h2 style={{ fontSize: '24px', color: '#1A2E0E', marginBottom: '8px', fontFamily: 'Georgia, serif' }}>
          Vendor not found
        </h2>
        <button
          onClick={() => navigate('/vendors')}
          style={{
            backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '12px 24px', fontSize: '15px',
            fontWeight: '600', cursor: 'pointer', marginTop: '16px',
          }}
        >
          ← Back to Vendors
        </button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2D4A1E 0%, #5C8A2E 100%)',
        padding: '48px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: '-60px', top: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginBottom: '32px' }}>
            <span onClick={() => navigate('/')} style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Home</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
            <span onClick={() => navigate('/vendors')} style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Vendors</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
            <span style={{ color: '#fff' }}>{vendor.store_name}</span>
          </div>

          {/* Vendor info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: vendor.logo_url ? 'transparent' : 'rgba(255,255,255,0.15)',
              border: '3px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '24px', color: '#fff', flexShrink: 0,
              overflow: 'hidden',
            }}>
              {vendor.logo_url
                ? <img src={vendor.logo_url} alt={vendor.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : vendor.store_name.slice(0, 2).toUpperCase()
              }
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '700', color: '#fff' }}>
                  {vendor.store_name}
                </h1>
                {vendor.verified && (
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                    borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.15)',
                    color: '#fff', letterSpacing: '0.05em',
                  }}>
                    ✓ Verified
                  </span>
                )}
              </div>
              {vendor.description && (
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', marginBottom: '8px' }}>
                  {vendor.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.65)', flexWrap: 'wrap' }}>
                {vendor.location && <span>📍 {vendor.location}</span>}
                <span>🗓 Member since {new Date(vendor.joined_at).getFullYear()}</span>
                <span>📦 {products.length} products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1200px', margin: '36px auto 0', padding: '0 24px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px', marginBottom: '40px',
        }}>
          {[
            { label: 'Rating', val: `${Number(vendor.rating).toFixed(1)} ★`, sub: 'Average score' },
            { label: 'Total Sales', val: vendor.total_sales, sub: 'Orders completed' },
            { label: 'Products', val: products.length, sub: 'Active listings' },
            { label: 'Reviews', val: vendor.total_reviews, sub: 'Total reviews' },
          ].map(s => (
            <div key={s.label} style={{
              backgroundColor: '#fff', borderRadius: '12px',
              border: '1.5px solid #e0dbd0', padding: '18px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '11px', color: '#7a8a6e', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Products */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
              Products by {vendor.store_name}
            </h2>
            <span style={{ fontSize: '14px', color: '#7a8a6e' }}>
              {products.length} listing{products.length !== 1 ? 's' : ''}
            </span>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a8a6e' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <p style={{ fontSize: '16px' }}>No products listed yet</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '18px',
            }}>
              {products.map((product: any) => {
                const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url
                  || product.product_images?.[0]?.image_url

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.slug}`)}
                    style={{
                      backgroundColor: '#fff', border: '1.5px solid #e0dbd0',
                      borderRadius: '14px', overflow: 'hidden',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'
                      e.currentTarget.style.borderColor = '#5C8A2E'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = '#e0dbd0'
                    }}
                  >
                    {/* Image */}
                    <div style={{
                      height: '150px', backgroundColor: '#EBF2DE',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '56px',
                    }}>
                      {primaryImage
                        ? <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🛍️'
                      }
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px' }}>
                      <h3 style={{
                        fontSize: '15px', fontWeight: '600', color: '#1A2E0E',
                        marginBottom: '6px', lineHeight: '1.3', fontFamily: 'Georgia, serif',
                      }}>
                        {product.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <Stars rating={Number(product.rating)} />
                        <span style={{ fontSize: '12px', color: '#7a8a6e' }}>
                          ({product.total_reviews})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <button
                          onClick={e => handleAddToCart(e, product)}
                          style={{
                            backgroundColor: addedId === product.id ? '#5C8A2E' : '#2D4A1E',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', transition: 'all 0.2s', minWidth: '80px',
                          }}
                        >
                          {addedId === product.id ? '✓ Added' : '+ Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/vendors')}
          style={{
            backgroundColor: 'transparent', color: '#7a8a6e',
            border: '1.5px solid #e0dbd0', borderRadius: '8px',
            padding: '10px 20px', fontSize: '14px', cursor: 'pointer',
            marginBottom: '48px',
          }}
        >
          ← Back to Vendors
        </button>
      </div>
    </div>
  )
}

export default VendorProfilePage