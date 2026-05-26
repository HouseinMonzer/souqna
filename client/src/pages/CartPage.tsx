import { useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { EmptyState } from '../components/ui'
import { useIsMobile } from '../hooks/useMediaQuery'

function CartPage() {
  document.title = 'My Cart | SouqNa'
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { vendorCarts, removeItem, updateQty, clearCart, total, vendorTotal } = useCartStore()
  const isMobile = useIsMobile()
  const totalCount = vendorCarts.reduce((s, vc) => s + vc.items.reduce((ss, i) => ss + i.quantity, 0), 0)

  if (vendorCarts.length === 0) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Discover products from local Lebanese vendors and add them to your cart."
          action={() => navigate('/shop')}
          actionLabel="Browse Shop"
        />
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '32px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700', marginBottom: '2px' }}>
              My Cart
            </h1>
            <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '13px' }}>
              {totalCount} item{totalCount !== 1 ? 's' : ''} from {vendorCarts.length} store{vendorCarts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={clearCart} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)', borderRadius: '8px', padding: '8px 16px',
            fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
          >
            🗑 Clear All
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '24px', alignItems: 'start' }}>

          {/* Left: Vendor carts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {vendorCarts.map(vc => (
              <div key={vc.vendorId} style={{
                backgroundColor: '#fff', borderRadius: '16px',
                border: '1.5px solid #e0dbd0', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                {/* Vendor header */}
                <div style={{
                  backgroundColor: '#f8faf5', borderBottom: '1.5px solid #e8f0dc',
                  padding: '14px 20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: '#EBF2DE', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: '700', color: '#2D4A1E', flexShrink: 0,
                    }}>
                      {vc.vendorLogo
                        ? <img src={vc.vendorLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : vc.vendorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        to={`/vendors/${vc.vendorSlug}`}
                        style={{ fontSize: '15px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#5C8A2E'}
                        onMouseLeave={e => e.currentTarget.style.color = '#1A2E0E'}
                      >
                        🏪 {vc.vendorName}
                      </Link>
                      <p style={{ fontSize: '12px', color: '#7a8a6e', margin: 0 }}>
                        {vc.items.length} item{vc.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#2D4A1E', fontFamily: 'Georgia, serif' }}>
                    ${vendorTotal(vc.vendorId).toFixed(2)}
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {vc.items.map(({ product, quantity, variant }) => (
                    <div key={product.id + (variant?.id || '')} style={{
                      display: 'flex', gap: '14px', alignItems: 'center',
                      paddingBottom: '12px', borderBottom: '1px solid #f0ece4',
                    }}>
                      {/* Image */}
                      <div style={{ width: '64px', height: '64px', borderRadius: '10px', backgroundColor: '#EBF2DE', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.primary_image
                          ? <img src={product.primary_image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '28px' }}>📦</span>}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/product/${product.slug}`} style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', textDecoration: 'none', fontFamily: 'Georgia, serif', display: 'block', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </Link>
                        {variant && <p style={{ fontSize: '12px', color: '#7a8a6e', margin: '0 0 6px' }}>{variant.option_name}: {variant.option_value}</p>}

                        {/* Qty controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => updateQty(product.id, quantity - 1, variant?.id ?? null)}
                            style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.5px solid #e0dbd0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#1A2E0E' }}
                          >−</button>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', minWidth: '18px', textAlign: 'center' }}>{quantity}</span>
                          <button
                            onClick={() => updateQty(product.id, quantity + 1, variant?.id ?? null)}
                            style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.5px solid #e0dbd0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#1A2E0E' }}
                          >+</button>
                        </div>
                      </div>

                      {/* Price + Remove */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', margin: '0 0 6px' }}>
                          ${(product.price * quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(product.id, variant?.id ?? null)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0, fontWeight: '600' }}
                        >Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Per-vendor checkout */}
                <div style={{ padding: '14px 20px', borderTop: '1.5px solid #e8f0dc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', backgroundColor: '#fafdf5' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#7a8a6e' }}>Subtotal from {vc.vendorName}</span>
                    <p style={{ fontSize: '18px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', margin: '2px 0 0' }}>
                      ${vendorTotal(vc.vendorId).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => user ? navigate(`/checkout/${vc.vendorId}`) : navigate('/sign-in')}
                    style={{
                      backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
                      borderRadius: '10px', padding: '11px 22px', fontSize: '14px',
                      fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5C8A2E'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D4A1E'}
                  >
                    Checkout from {vc.vendorName} →
                  </button>
                </div>
              </div>
            ))}

            <Link to="/shop" style={{ fontSize: '14px', color: '#7a8a6e', textAlign: 'center', display: 'block', padding: '10px', textDecoration: 'none' }}>
              ← Continue Shopping
            </Link>
          </div>

          {/* Right: Grand total */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: '22px', position: isMobile ? 'static' : 'sticky', top: '90px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1A2E0E', marginBottom: '18px' }}>
              Cart Summary
            </h3>

            {/* Per-vendor breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {vendorCarts.map(vc => (
                <div key={vc.vendorId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#5C8A2E', fontWeight: '600' }}>🏪 {vc.vendorName}</span>
                  <span style={{ color: '#1A2E0E', fontWeight: '600' }}>${vendorTotal(vc.vendorId).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1.5px solid #e0dbd0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1A2E0E' }}>Grand Total</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#2D4A1E', fontFamily: 'Georgia, serif' }}>
                ${total().toFixed(2)}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#7a8a6e', lineHeight: 1.5, marginBottom: '16px', backgroundColor: '#f8faf5', padding: '10px 12px', borderRadius: '8px' }}>
              💡 Each vendor is a separate store. Checkout from each one individually to complete your orders.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {vendorCarts.map(vc => (
                <button
                  key={vc.vendorId}
                  onClick={() => user ? navigate(`/checkout/${vc.vendorId}`) : navigate('/sign-in')}
                  style={{
                    width: '100%', backgroundColor: '#2D4A1E', color: '#fff',
                    border: 'none', borderRadius: '8px', padding: '12px',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5C8A2E'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D4A1E'}
                >
                  Checkout {vc.vendorName} (${vendorTotal(vc.vendorId).toFixed(2)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
