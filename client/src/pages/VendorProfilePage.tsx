import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { vendorService } from '../api/vendors'
import { productService } from '../api/products'
import { useCartStore } from '../store/cartStore'
import { Stars, ProductCardSkeleton, EmptyState } from '../components/ui'
import { useIsMobile } from '../hooks/useMediaQuery'
import type { Vendor, Product, Category } from '../types/database.types'


type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular'

function VendorProfilePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language?.startsWith('ar')
  const { addItem } = useCartStore()

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!slug) return
    document.title = `${t('common.loading')} | SouQna`
    const fetchData = async () => {
      setLoading(true)
      try {
        const vendorData = await vendorService.getBySlug(slug)
        const productsData = vendorData ? await productService.getByVendor(vendorData.id) : []
        setVendor(vendorData)
        setProducts(productsData ?? [])
        if (vendorData) document.title = `${vendorData.store_name} | SouqNa`
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  const categories = useMemo<Category[]>(() => {
    const seen = new Set<string>()
    const cats: Category[] = []
    for (const p of products) {
      const cat = p.categories || p.category
      if (cat && !seen.has(cat.id)) {
        seen.add(cat.id)
        cats.push(cat)
      }
    }
    return cats
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = products
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q))
    }
    if (activeCategory !== 'all') {
      list = list.filter(p => (p.categories?.id || p.category?.id) === activeCategory)
    }
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (sort === 'popular') list = [...list].sort((a, b) => b.total_sold - a.total_sold)
    else list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return list
  }, [products, search, sort, activeCategory])

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    const productCard = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_price: product.compare_price,
      rating: product.rating,
      total_reviews: product.total_reviews,
      total_sold: product.total_sold,
      featured: product.featured,
      primary_image: product.primary_image,
      vendor: product.vendor || product.vendors || { id: vendor!.id, store_name: vendor!.store_name, slug: vendor!.slug },
      category: product.category || product.categories || null,
    }
    addItem(productCard, 1, null)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
        {/* Hero skeleton */}
        <div style={{ height: '340px', background: 'linear-gradient(135deg, #2D4A1E, #5C8A2E)', position: 'relative' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 0' }}>
            <div style={{ height: '14px', width: '200px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: '40px' }} />
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ height: '32px', width: '220px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: '12px' }} />
                <div style={{ height: '14px', width: '320px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dir={isRTL ? 'rtl' : 'ltr'}>
        <EmptyState icon="😕" title={t('vendors.noVendors')} message=""
          action={() => navigate('/vendors')} actionLabel={`${isRTL ? '→' : '←'} ${t('vendors.title')}`} />
      </div>
    )
  }

  const socialLinks = [
    vendor.instagram && { icon: '📸', href: vendor.instagram.startsWith('http') ? vendor.instagram : `https://instagram.com/${vendor.instagram}`, label: 'Instagram' },
    vendor.facebook && { icon: '👥', href: vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`, label: 'Facebook' },
    vendor.tiktok && { icon: '🎵', href: vendor.tiktok.startsWith('http') ? vendor.tiktok : `https://tiktok.com/@${vendor.tiktok}`, label: 'TikTok' },
    vendor.youtube && { icon: '▶️', href: vendor.youtube.startsWith('http') ? vendor.youtube : `https://youtube.com/${vendor.youtube}`, label: 'YouTube' },
  ].filter(Boolean) as { icon: string; href: string; label: string }[]

  const vendorSocialLinks = (vendor.social_links || []).map(sl => {
    const icons: Record<string, string> = { instagram: '📸', facebook: '👥', tiktok: '🎵', youtube: '▶️', twitter: '🐦', linkedin: '💼' }
    return { icon: icons[sl.platform] || '🔗', href: sl.url, label: sl.platform }
  })

  const allSocialLinks = [...socialLinks, ...vendorSocialLinks]

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Cover + Profile Hero ─────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        {/* Cover image */}
        <div style={{
          height: '280px', position: 'relative', overflow: 'hidden',
          background: vendor.cover_url
            ? `url(${vendor.cover_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a2f11 0%, #2D4A1E 40%, #5C8A2E 100%)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
          }} />

          {/* Breadcrumb */}
          <div style={{ position: 'absolute', top: '20px', left: '24px', right: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '8px', fontSize: '13px' }}>
            <span onClick={() => navigate('/')} style={{ color: 'rgba(255,255,255,0.65)', cursor: 'pointer' }}>{t('nav.home')}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{isRTL ? '‹' : '›'}</span>
            <span onClick={() => navigate('/vendors')} style={{ color: 'rgba(255,255,255,0.65)', cursor: 'pointer' }}>{t('nav.vendors')}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{isRTL ? '‹' : '›'}</span>
            <span style={{ color: '#fff', fontWeight: '600' }}>{vendor.store_name}</span>
          </div>
        </div>

        {/* Profile card overlapping cover */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            marginTop: '-70px', position: 'relative', zIndex: 10,
            display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap',
          }}>
            {/* Logo */}
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              border: '4px solid #F7F2E8',
              backgroundColor: vendor.logo_url ? 'transparent' : '#2D4A1E',
              overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '32px', color: '#F7F2E8',
            }}>
              {vendor.logo_url
                ? <img src={vendor.logo_url} alt={vendor.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : vendor.store_name.slice(0, 2).toUpperCase()}
            </div>

            {/* Store info */}
            <div style={{ flex: 1, minWidth: '200px', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', color: '#1A2E0E', margin: 0 }}>
                  {vendor.store_name}
                </h1>
                {vendor.verified && (
                  <span style={{ backgroundColor: '#EBF2DE', color: '#2D4A1E', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.05em' }}>
                    ✓ {t('vendors.verified')}
                  </span>
                )}
              </div>
              {vendor.description && (
                <p style={{ fontSize: '15px', color: '#4a5a3e', margin: '0 0 8px', lineHeight: 1.5 }}>
                  {vendor.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: '#7a8a6e', flexWrap: 'wrap', alignItems: 'center' }}>
                {vendor.location && <span>📍 {vendor.location}</span>}
                <span>🗓 Since {new Date(vendor.joined_at).getFullYear()}</span>
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} style={{ color: '#5C8A2E', fontWeight: '600', textDecoration: 'none' }}>
                    📞 {vendor.phone}
                  </a>
                )}
                {vendor.whatsapp && (
                  <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ backgroundColor: '#25D366', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', textDecoration: 'none' }}>
                    WhatsApp
                  </a>
                )}
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ color: '#5C8A2E', fontWeight: '600', textDecoration: 'none' }}>
                    🌐 Website
                  </a>
                )}
              </div>
            </div>

            {/* Social links */}
            {allSocialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', paddingBottom: '16px' }}>
                {allSocialLinks.map(sl => (
                  <a key={sl.href} href={sl.href} target="_blank" rel="noopener noreferrer" title={sl.label} style={{
                    width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EBF2DE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    textDecoration: 'none', transition: 'background 0.2s', border: '1.5px solid #c8d8a8',
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d0e8b0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EBF2DE'}
                  >
                    {sl.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { icon: '⭐', label: t('shop.sortPopular'), val: `${Number(vendor.rating).toFixed(1)}`, sub: `${vendor.total_reviews}` },
            { icon: '🛍️', label: t('checkout.title'), val: String(vendor.total_sales), sub: '' },
            { icon: '📦', label: t('vendors.products'), val: String(products.length), sub: '' },
            { icon: '📅', label: '', val: String(new Date(vendor.joined_at).getFullYear()), sub: new Date(vendor.joined_at).toLocaleDateString(isRTL ? 'ar' : 'en', { month: 'long' }) },
          ].map(s => (
            <div key={s.label} style={{
              backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0',
              padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>{s.val}</div>
              <div style={{ fontSize: '12px', color: '#7a8a6e', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Search + Filter + Sort ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7a8a6e', fontSize: '14px', pointerEvents: 'none' } as React.CSSProperties}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`${t('common.search')} ${vendor.store_name}...`}
              style={{ width: '100%', padding: isRTL ? '10px 36px 10px 14px' : '10px 14px 10px 36px', borderRadius: '10px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
              onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
              onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}
          >
            <option value="newest">{t('shop.sortNewest')}</option>
            <option value="price-asc">{t('shop.sortPriceAsc')}</option>
            <option value="price-desc">{t('shop.sortPriceDesc')}</option>
            <option value="popular">{t('shop.sortPopular')}</option>
          </select>
        </div>

        {/* Category pills */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                backgroundColor: activeCategory === 'all' ? '#2D4A1E' : '#fff',
                color: activeCategory === 'all' ? '#fff' : '#4a5a3e',
                border: `1.5px solid ${activeCategory === 'all' ? '#2D4A1E' : '#e0dbd0'}`,
              }}
            >
              {t('shop.allCategories')} ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: activeCategory === cat.id ? '#2D4A1E' : '#fff',
                  color: activeCategory === cat.id ? '#fff' : '#4a5a3e',
                  border: `1.5px solid ${activeCategory === cat.id ? '#2D4A1E' : '#e0dbd0'}`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Products Grid ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', margin: 0 }}>
              {t('vendors.products')}
            </h2>
            <span style={{ fontSize: '13px', color: '#7a8a6e' }}>
              {filteredProducts.length} {filteredProducts.length !== products.length ? `of ${products.length}` : ''} listing{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState icon="🔍" title="No products found" message={search ? `No results for "${search}"` : 'No products in this category yet.'} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
              {filteredProducts.map((product) => {
                const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url
                  || product.product_images?.[0]?.image_url || product.primary_image
                const discount = product.compare_price && product.compare_price > product.price
                  ? Math.round(100 - (product.price / product.compare_price) * 100)
                  : 0
                const inStock = product.stock > 0

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.slug}`)}
                    style={{
                      backgroundColor: '#fff', border: '1.5px solid #e0dbd0',
                      borderRadius: '16px', overflow: 'hidden',
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.1)'
                      e.currentTarget.style.borderColor = '#5C8A2E'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'
                      e.currentTarget.style.borderColor = '#e0dbd0'
                    }}
                  >
                    {/* Image */}
                    <div style={{ height: '190px', backgroundColor: '#EBF2DE', position: 'relative', overflow: 'hidden' }}>
                      {primaryImage
                        ? <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '56px' }}>🛍️</div>}

                      {/* Badges */}
                      <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {discount > 0 && (
                          <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                            -{discount}%
                          </span>
                        )}
                        {!inStock && (
                          <span style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', marginBottom: '6px', lineHeight: '1.3', fontFamily: 'Georgia, serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                        {product.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <Stars rating={Number(product.rating)} />
                        <span style={{ fontSize: '12px', color: '#7a8a6e' }}>({product.total_reviews})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                            ${Number(product.price).toFixed(2)}
                          </span>
                          {product.compare_price && product.compare_price > product.price && (
                            <span style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'line-through', marginLeft: '6px' }}>
                              ${Number(product.compare_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={e => handleAddToCart(e, product)}
                          disabled={!inStock}
                          style={{
                            backgroundColor: addedId === product.id ? '#5C8A2E' : inStock ? '#2D4A1E' : '#e0dbd0',
                            color: inStock ? '#fff' : '#7a8a6e',
                            border: 'none', borderRadius: '8px',
                            padding: '7px 14px', fontSize: '12px', fontWeight: '600',
                            cursor: inStock ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s', minWidth: '72px',
                          }}
                        >
                          {addedId === product.id ? '✓ Added' : inStock ? '+ Cart' : 'Sold Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Back */}
        <Link to="/vendors" style={{
          display: 'inline-block', color: '#7a8a6e', border: '1.5px solid #e0dbd0',
          borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
          textDecoration: 'none', marginBottom: '48px', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#5C8A2E'; e.currentTarget.style.color = '#2D4A1E' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0dbd0'; e.currentTarget.style.color = '#7a8a6e' }}
        >
          ← Back to Vendors
        </Link>
      </div>
    </div>
  )
}

export default VendorProfilePage
