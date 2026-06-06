import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { productService } from '../api/products'
import { useCartStore } from '../store/cartStore'
import { Skeleton } from '../components/ui'
import { useIsMobile } from '../hooks/useMediaQuery'
import type { Product, ProductImage, ProductVariant } from '../types/database.types'

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
  const { addItem } = useCartStore()
  const [added, setAdded] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty] = useState(1)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    productService.getBySlug(slug)
      .then((data) => {
        setProduct(data)
        const primary = data?.product_images?.find((img: ProductImage) => img.is_primary)?.image_url
          || data?.product_images?.[0]?.image_url
        setSelectedImage(primary ?? null)
        if (data?.category_id) {
          productService.getRelated(data.category_id, data.id, 3)
            .then((rel) => setRelated(rel ?? []))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (product) document.title = `${product.name} | SouqNa`
  }, [product])

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px' }}>
          <Skeleton height={440} borderRadius={16} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <Skeleton height={14} width="40%" />
            <Skeleton height={32} width="85%" />
            <Skeleton height={14} width="30%" />
            <Skeleton height={20} width="25%" />
            <Skeleton height={100} />
            <Skeleton height={52} borderRadius={10} />
          </div>
        </div>
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
  const displayPrice = product.price + (selectedVariant?.price_adjustment || 0)

  const handleAddToCart = () => {
    const vendor = (product as any).vendor || product.vendors
    if (!vendor) return
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: displayPrice,
      compare_price: product.compare_price,
      rating: product.rating,
      total_reviews: product.total_reviews,
      total_sold: product.total_sold,
      featured: product.featured,
      primary_image: selectedImage || (product as any).primary_image,
      vendor: { id: vendor.id, store_name: vendor.store_name, slug: vendor.slug },
      category: (product as any).category || product.categories || null,
    }, qty, selectedVariant)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '24px' : '48px', marginBottom: '64px' }}>

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
                {images.map((img: ProductImage) => (
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
              ${displayPrice.toFixed(2)}
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

            {/* Quantity selector */}
            {product.stock > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0dbd0', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: '36px', height: '36px', border: 'none', backgroundColor: '#f8faf5', cursor: 'pointer', fontSize: '18px', color: '#2D4A1E', fontWeight: '700' }}
                  >−</button>
                  <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: '600', color: '#1A2E0E' }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    style={{ width: '36px', height: '36px', border: 'none', backgroundColor: '#f8faf5', cursor: 'pointer', fontSize: '18px', color: '#2D4A1E', fontWeight: '700' }}
                  >+</button>
                </div>
              </div>
            )}

            {/* Variants */}
            {product.product_variants && product.product_variants.length > 0 && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', marginBottom: '8px' }}>Options:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.product_variants.map((v: ProductVariant) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        border: `2px solid ${selectedVariant?.id === v.id ? '#2D4A1E' : '#e0dbd0'}`,
                        backgroundColor: selectedVariant?.id === v.id ? '#EBF2DE' : '#fff',
                        color: '#1A2E0E',
                      }}
                    >
                      {v.option_name}: {v.option_value}
                      {v.price_adjustment !== 0 && ` (+$${v.price_adjustment.toFixed(2)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                style={{
                  flex: 1, backgroundColor: added ? '#5C8A2E' : '#2D4A1E',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '15px 24px', fontSize: '16px', fontWeight: '600',
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  opacity: product.stock === 0 ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(45,74,30,0.3)',
                  transition: 'background-color 0.2s',
                }}
              >
                {added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
              </button>
              <button
                onClick={() => navigate('/cart')}
                style={{
                  backgroundColor: '#fff', color: '#2D4A1E',
                  border: '1.5px solid #e0dbd0', borderRadius: '10px',
                  padding: '15px 20px', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
                }}
              >
                View Cart
              </button>
            </div>

            {/* Vendor info */}
            {product.vendors && (
              <div
                onClick={() => product.vendors && navigate(`/vendors/${product.vendors.slug}`)}
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

            <button onClick={() => navigate(-1)} style={{ backgroundColor: 'transparent', color: '#7a8a6e', border: 'none', fontSize: '14px', cursor: 'pointer', textAlign: 'left', padding: '0' }}>
              ← Back
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
              {related.map((p) => {
                const img = p.product_images?.find(i => i.is_primary)?.image_url || p.product_images?.[0]?.image_url
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/product/${p.slug}`)}
                    style={{ backgroundColor: '#fff', border: '1.5px solid #e0dbd0', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: '120px', backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      {img ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : '🛍️'}
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
