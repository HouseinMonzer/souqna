import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { apiFetch } from '../lib/api'
import { Spinner } from '../components/ui'
import { useIsMobile } from '../hooks/useMediaQuery'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '8px',
  border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: '#fff',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: '600', color: '#1A2E0E', marginBottom: '6px',
}

const PAYMENT_OPTIONS = [
  { id: 'wish_money', label: 'Wish Money', icon: '💸', info: 'Pay via Wish Money to: +961 76 123 456' },
  { id: 'omt', label: 'OMT Transfer', icon: '🏦', info: 'OMT Account: #12345678 — Souqna Lebanon' },
  { id: 'cash_delivery', label: 'Cash on Delivery', icon: '💵', info: 'Pay cash when your order arrives' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳', info: 'Visa / Mastercard — secure checkout' },
]

function CheckoutPage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const navigate = useNavigate()
  const { getVendorCart, clearVendorCart } = useCartStore()
  const cart = vendorId ? getVendorCart(vendorId) : undefined

  const [form, setForm] = useState({
    name: '', address: '', city: '', phone: '', note: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('cash_delivery')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const isMobile = useIsMobile()

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛒</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#1A2E0E', marginBottom: '12px' }}>
            No items to checkout
          </h2>
          <Link to="/cart" style={{ color: '#5C8A2E', fontWeight: '600', fontSize: '15px' }}>
            ← Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const shipping = 3.5
  const total = subtotal + shipping

  if (orderNumber) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', backgroundColor: '#fff', borderRadius: '20px', padding: '48px 32px', border: '1.5px solid #e0dbd0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', color: '#1A2E0E', marginBottom: '12px' }}>
            Order Placed!
          </h2>
          <p style={{ fontSize: '15px', color: '#4a5a3e', lineHeight: 1.7, marginBottom: '20px' }}>
            Your order from <strong>{cart.vendorName}</strong> has been placed successfully.
          </p>
          <div style={{ backgroundColor: '#EBF2DE', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#5C8A2E', fontWeight: '700', margin: 0 }}>
              Order #{orderNumber}
            </p>
          </div>
          <button onClick={() => navigate('/shop')} style={{
            width: '100%', backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px',
          }}>
            Continue Shopping
          </button>
          <button onClick={() => navigate('/dashboard')} style={{
            width: '100%', backgroundColor: 'transparent', color: '#7a8a6e', border: '1.5px solid #e0dbd0',
            borderRadius: '10px', padding: '12px', fontSize: '14px', cursor: 'pointer',
          }}>
            View My Orders
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city || !form.phone) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await apiFetch<{ data: { order_number: string } }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          cartItems: cart.items.map(i => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
            product: {
              id: i.product.id,
              price: i.product.price,
              name: i.product.name,
              primary_image: i.product.primary_image,
              vendor: { id: i.product.vendor.id },
            },
          })),
          shippingInfo: {
            shipping_name: form.name,
            shipping_address: form.address,
            shipping_city: form.city,
            shipping_phone: form.phone,
            customer_note: form.note,
            payment_method: paymentMethod,
            shipping_cost: shipping,
          },
        }),
      })
      clearVendorCart(vendorId!)
      setOrderNumber(res.data.order_number)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Order failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '28px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <Link to="/cart" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Cart
          </Link>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700', marginTop: '8px', marginBottom: '2px' }}>
            Checkout
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '13px' }}>
            From <strong style={{ color: '#A3C46C' }}>{cart.vendorName}</strong>
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '28px', alignItems: 'start' }}>

          {/* Left: Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Shipping */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: '24px' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1A2E0E', marginBottom: '20px' }}>
                Shipping Information
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Address *</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street, Building, Floor..." style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Beirut" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+961..." style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Order Note (optional)</label>
                  <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Any special instructions..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: '24px' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1A2E0E', marginBottom: '20px' }}>
                Payment Method
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PAYMENT_OPTIONS.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    style={{
                      padding: '14px 16px', borderRadius: '10px',
                      border: `2px solid ${paymentMethod === opt.id ? '#2D4A1E' : '#e0dbd0'}`,
                      cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                      backgroundColor: paymentMethod === opt.id ? '#f8faf5' : '#fff', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', margin: 0 }}>{opt.label}</p>
                      {paymentMethod === opt.id && <p style={{ fontSize: '12px', color: '#5C8A2E', margin: '3px 0 0' }}>{opt.info}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right: Order Summary */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: '22px', position: isMobile ? 'static' : 'sticky', top: '90px', width: '100%', boxSizing: 'border-box' }}>
            {/* Vendor header */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #e0dbd0' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EBF2DE', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#2D4A1E' }}>
                {cart.vendorLogo
                  ? <img src={cart.vendorLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : cart.vendorName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#5C8A2E', fontWeight: '600', margin: 0 }}>Ordering from</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', margin: 0 }}>{cart.vendorName}</p>
              </div>
            </div>

            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1A2E0E', marginBottom: '14px' }}>Order Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {cart.items.map(({ product, quantity, variant }) => (
                <div key={product.id + (variant?.id || '')} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#EBF2DE', overflow: 'hidden', flexShrink: 0 }}>
                    {product.primary_image
                      ? <img src={product.primary_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '18px' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                    {variant && <p style={{ fontSize: '11px', color: '#7a8a6e', margin: '1px 0 0' }}>{variant.option_name}: {variant.option_value}</p>}
                    <p style={{ fontSize: '11px', color: '#7a8a6e', margin: '1px 0 0' }}>× {quantity}</p>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', flexShrink: 0 }}>
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e0dbd0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4a5a3e' }}>
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4a5a3e' }}>
                <span>Shipping</span><span>${shipping.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '700', color: '#1A2E0E', paddingTop: '6px', borderTop: '1px solid #e0dbd0' }}>
                <span>Total</span>
                <span style={{ fontFamily: 'Georgia, serif' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p style={{ color: '#c62828', fontSize: '13px', backgroundColor: '#fce4ec', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}>{error}</p>
            )}

            <button onClick={handleSubmit} disabled={submitting} style={{
              width: '100%', backgroundColor: submitting ? '#7a8a6e' : '#2D4A1E', color: '#fff',
              border: 'none', borderRadius: '10px', padding: '15px', fontSize: '15px', fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}>
              {submitting ? <><Spinner size={18} color="#fff" /> Placing Order...</> : 'Place Order →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
