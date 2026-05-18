import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

function CartPage() {
  const navigate = useNavigate()
  const { items, removeFromCart, increaseQty, decreaseQty, clearCart, totalPrice } = useCartStore()

  if (items.length === 0) {
    return (
      <div style={{
        backgroundColor: '#F7F2E8', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
      }}>
        <div style={{ fontSize: '72px' }}>🛒</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', color: '#1A2E0E' }}>
          Your cart is empty
        </h2>
        <p style={{ color: '#7a8a6e', fontSize: '15px' }}>
          Discover products from local Lebanese vendors
        </p>
        <button
          onClick={() => navigate('/shop')}
          style={{
            backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '13px 28px', fontSize: '15px',
            fontWeight: '600', cursor: 'pointer', marginTop: '8px',
          }}
        >
          Browse Shop →
        </button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            color: '#F7F2E8', fontFamily: 'Georgia, serif',
            fontSize: '30px', fontWeight: '700', marginBottom: '4px',
          }}>
            Your Cart
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.6)', fontSize: '14px' }}>
            {items.reduce((s, i) => s + i.quantity, 0)} items
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px', alignItems: 'start' }}>

          {/* Items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {items.map(({ product, quantity }) => (
              <div key={product.id} style={{
                backgroundColor: '#fff', borderRadius: '14px',
                border: '1.5px solid #e0dbd0', padding: '18px',
                display: 'flex', gap: '16px', alignItems: 'center',
              }}>
                {/* Emoji */}
                <div style={{
                  width: '70px', height: '70px', borderRadius: '10px',
                  backgroundColor: '#EBF2DE', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', flexShrink: 0,
                }}>
                  {product.emoji}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', color: '#5C8A2E', fontWeight: '600', marginBottom: '2px' }}>
                    {product.vendor}
                  </p>
                  <h3 style={{
                    fontSize: '15px', fontWeight: '600', color: '#1A2E0E',
                    marginBottom: '8px', fontFamily: 'Georgia, serif',
                  }}>
                    {product.name}
                  </h3>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => decreaseQty(product.id)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: '1.5px solid #e0dbd0', backgroundColor: '#fff',
                        fontSize: '16px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#1A2E0E',
                      }}
                    >−</button>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E', minWidth: '20px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => increaseQty(product.id)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: '1.5px solid #e0dbd0', backgroundColor: '#fff',
                        fontSize: '16px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#1A2E0E',
                      }}
                    >+</button>
                  </div>
                </div>

                {/* Price + Remove */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    style={{
                      background: 'none', border: 'none', color: '#c0392b',
                      fontSize: '13px', cursor: 'pointer', padding: '0',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Clear cart */}
            <button
              onClick={clearCart}
              style={{
                background: 'none', border: '1.5px solid #e0dbd0',
                borderRadius: '8px', padding: '10px', fontSize: '14px',
                color: '#7a8a6e', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#c0392b'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e0dbd0'}
            >
              🗑 Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '14px',
            border: '1.5px solid #e0dbd0', padding: '22px',
            position: 'sticky', top: '90px',
          }}>
            <h3 style={{
              fontSize: '18px', fontWeight: '700', color: '#1A2E0E',
              fontFamily: 'Georgia, serif', marginBottom: '20px',
            }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#4a5a3e' }}>{product.name} × {quantity}</span>
                  <span style={{ color: '#1A2E0E', fontWeight: '500' }}>
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e0dbd0', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1A2E0E' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: '700', color: '#2D4A1E', fontFamily: 'Georgia, serif' }}>
                  ${totalPrice().toFixed(2)}
                </span>
              </div>
            </div>

            <button
              style={{
                width: '100%', backgroundColor: '#2D4A1E', color: '#fff',
                border: 'none', borderRadius: '10px', padding: '15px',
                fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5C8A2E'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D4A1E'}
            >
              Checkout →
            </button>

            <button
              onClick={() => navigate('/shop')}
              style={{
                width: '100%', backgroundColor: 'transparent', color: '#7a8a6e',
                border: 'none', fontSize: '14px', cursor: 'pointer',
                marginTop: '12px', padding: '8px',
              }}
            >
              ← Continue Shopping
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CartPage