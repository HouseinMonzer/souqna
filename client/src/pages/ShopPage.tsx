import { useCallback, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '../lib/api'
import { productService } from '../api/products'
import { useCartStore } from '../store/cartStore'
import { sampleCategories, sampleProducts } from '../data/sampleData'
import type { Category, Product } from '../types/database.types'
import { ProductCardSkeleton } from '../components/ui'

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#d4cfc0', fontSize: '12px' }}>★</span>
      ))}
    </span>
  )
}

function ShopPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language?.startsWith('ar')
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'default')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<Pick<Category, 'id' | 'name'>>>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState<string | null>(null)
  const { addItem } = useCartStore()

  document.title = `${t('shop.title')} | SouQna`

  // Sync URL search param to state on mount / URL change
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearch(urlSearch)
  }, [searchParams])

  // Fetch categories
  useEffect(() => {
    apiFetch<{ data: Category[] }>('/api/categories')
      .then(({ data }) => setCategories(data && data.length > 0 ? data : sampleCategories))
      .catch(() => setCategories(sampleCategories))
  }, [])

  const filterSampleProducts = useCallback((items: Product[]) => {
    return items.filter(item => {
      if (activeCategory && item.category_id !== activeCategory) return false
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })
  }, [activeCategory, search, sortBy])

  // Fetch products
  useEffect(() => {
    setLoading(true)
    productService.getAll(1, 48, {
      category: activeCategory,
      search,
      sort: sortBy,
    }).then(({ data }) => {
      if (!data || data.length === 0) {
        setProducts(filterSampleProducts(sampleProducts as unknown as Product[]))
      } else {
        setProducts(data)
      }
      setLoading(false)
    }).catch(() => {
      setProducts(filterSampleProducts(sampleProducts as Product[]))
      setLoading(false)
    })
  }, [activeCategory, search, sortBy, filterSampleProducts])

  const handleAddToCart = (e: React.MouseEvent, product: Product, primaryImage?: string) => {
    e.stopPropagation()
    const vendor = (product as any).vendor || product.vendors
    if (!vendor) return
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_price: product.compare_price,
      rating: product.rating,
      total_reviews: product.total_reviews,
      total_sold: product.total_sold,
      featured: product.featured,
      primary_image: primaryImage || (product as any).primary_image,
      vendor: { id: vendor.id, store_name: vendor.store_name, slug: vendor.slug },
      category: (product as any).category || product.categories || null,
    }, 1, null)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '36px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>
            {t('shop.title')}
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '15px' }}>
            {loading ? t('common.loading') : t('shop.showing', { count: products.length })}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Search + Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#7a8a6e' } as React.CSSProperties}>🔍</span>
            <input
              type="text"
              placeholder={t('nav.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: isRTL ? '10px 36px 10px 16px' : '10px 16px 10px 36px',
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
            <option value="default">{t('shop.sortNewest')}</option>
            <option value="price-asc">{t('shop.sortPriceAsc')}</option>
            <option value="price-desc">{t('shop.sortPriceDesc')}</option>
            <option value="rating">{t('shop.sortPopular')}</option>
          </select>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: '8px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '500',
              cursor: 'pointer',
              border: !activeCategory ? 'none' : '1.5px solid #e0dbd0',
              backgroundColor: !activeCategory ? '#2D4A1E' : '#fff',
              color: !activeCategory ? '#F7F2E8' : '#1A2E0E',
            }}
          >
            {t('shop.allCategories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{
                padding: '8px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer',
                border: activeCategory === cat.id ? 'none' : '1.5px solid #e0dbd0',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7a8a6e' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1A2E0E', marginBottom: '8px' }}>{t('products.noProducts')}</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory(null); setSortBy('default') }}
              style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#2D4A1E', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              {t('products.clearFilters')}
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: '#7a8a6e', marginBottom: '20px' }}>
              {t('shop.showing', { count: products.length })}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {products.map((product) => {
                const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url
                  || product.product_images?.[0]?.image_url
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.slug}`)}
                    style={{
                      backgroundColor: '#fff', border: '1.5px solid #e0dbd0',
                      borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
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
                    <div style={{ height: '160px', backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', position: 'relative', overflow: 'hidden' }}>
                      {primaryImage
                        ? <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        : '🛍️'
                      }
                      {product.compare_price && product.compare_price > product.price && (
                        <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                          -{Math.round(100 - (product.price / product.compare_price) * 100)}%
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '14px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#5C8A2E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        {product.vendors?.store_name}
                      </p>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E', marginBottom: '6px', lineHeight: '1.3', fontFamily: 'Georgia, serif' }}>
                        {product.name}
                      </h3>
                      {product.short_description && (
                        <p style={{ fontSize: '13px', color: '#7a8a6e', marginBottom: '10px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                          {product.short_description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                        <Stars rating={Number(product.rating)} />
                        <span style={{ fontSize: '12px', color: '#7a8a6e' }}>({product.total_reviews})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                            ${Number(product.price).toFixed(2)}
                          </span>
                          {product.compare_price && product.compare_price > product.price && (
                            <span style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'line-through', marginLeft: '6px' }}>
                              ${Number(product.compare_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={e => handleAddToCart(e, product, primaryImage)}
                          style={{
                            backgroundColor: addedId === product.id ? '#5C8A2E' : '#2D4A1E',
                            color: '#fff', border: 'none',
                            borderRadius: '8px', padding: '9px 18px', fontSize: '13px',
                            fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s',
                          }}
                        >
                          {addedId === product.id ? t('products.added') : t('products.addToCart')}
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
