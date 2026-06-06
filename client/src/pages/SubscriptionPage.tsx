import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { Spinner } from '../components/ui'
import type { SubscriptionPlan, PaymentMethod } from '../types/database.types'
import { SUBSCRIPTION_PRICES } from '../types/database.types'

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { id: 'wish_money', label: 'Wish Money', icon: '💸', desc: 'Transfer to: +961 XX XXX XXX' },
  { id: 'omt', label: 'OMT', desc: 'Transfer to: OMT Account #12345678', icon: '🏦' },
  { id: 'cash_delivery', label: 'Cash on Delivery', icon: '💵', desc: 'Pay cash when our agent visits' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳', desc: 'Visa / Mastercard' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '8px',
  border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  backgroundColor: '#fff',
}

function CardForm() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
      <input placeholder="Card Number" maxLength={19} style={inputStyle} onChange={e => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 16)
        e.target.value = v.replace(/(.{4})/g, '$1 ').trim()
      }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <input placeholder="MM / YY" maxLength={5} style={inputStyle} />
        <input placeholder="CVV" maxLength={4} type="password" style={inputStyle} />
      </div>
      <input placeholder="Cardholder Name" style={inputStyle} />
      <p style={{ fontSize: '12px', color: '#7a8a6e', backgroundColor: '#f8faf5', padding: '8px 12px', borderRadius: '8px' }}>
        🔒 Card information is encrypted and secure. Payments processed upon admin approval.
      </p>
    </div>
  )
}

function SubscriptionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan')
  const [plan, setPlan] = useState<SubscriptionPlan>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wish_money')
  const [proofFile, setProofFile] = useState<string>('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const savings = Math.round(100 - (SUBSCRIPTION_PRICES.annual / (SUBSCRIPTION_PRICES.monthly * 12)) * 100)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setProofFile(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await apiFetch('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          plan,
          paymentMethod,
          paymentProof: proofFile || null,
          shippingAddress: paymentMethod === 'cash_delivery' ? address : null,
        }),
      })
      setStep('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'success') {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', backgroundColor: '#fff', borderRadius: '20px', padding: '48px 32px', border: '1.5px solid #e0dbd0', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', color: '#1A2E0E', marginBottom: '12px' }}>
            Payment Submitted!
          </h2>
          <p style={{ fontSize: '15px', color: '#4a5a3e', lineHeight: 1.7, marginBottom: '24px' }}>
            Your subscription request has been received. Our team will review your payment and activate your account within <strong>24–48 hours</strong>.
          </p>
          <div style={{ backgroundColor: '#EBF2DE', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#2D4A1E', fontWeight: '600', margin: 0 }}>
              Plan: {plan === 'monthly' ? 'Monthly' : 'Annual'} · ${SUBSCRIPTION_PRICES[plan]}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{
            width: '100%', backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
          }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '40px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#A3C46C', fontSize: '12px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Vendor Subscription
          </p>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
            Unlock Your Vendor Store
          </h1>
          <p style={{ color: 'rgba(247,242,232,0.7)', fontSize: '15px' }}>
            Choose a plan to start selling on SouqNa and reach thousands of customers.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
          {['Choose Plan', 'Payment', 'Confirm'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: i === (step === 'plan' ? 0 : 1) ? '#2D4A1E' : i < (step === 'plan' ? 0 : 1) ? '#5C8A2E' : '#e0dbd0',
                color: i <= (step === 'plan' ? 0 : 1) ? '#fff' : '#7a8a6e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700',
              }}>{i + 1}</div>
              <span style={{ fontSize: '13px', color: i === (step === 'plan' ? 0 : 1) ? '#1A2E0E' : '#7a8a6e', fontWeight: i === (step === 'plan' ? 0 : 1) ? '600' : '400' }}>
                {label}
              </span>
              {i < 2 && <div style={{ width: '40px', height: '2px', backgroundColor: '#e0dbd0' }} />}
            </div>
          ))}
        </div>

        {step === 'plan' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1A2E0E', marginBottom: '24px', textAlign: 'center' }}>
              Select Your Plan
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              {/* Monthly */}
              <div
                onClick={() => setPlan('monthly')}
                style={{
                  backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
                  border: `2px solid ${plan === 'monthly' ? '#2D4A1E' : '#e0dbd0'}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: plan === 'monthly' ? '0 4px 16px rgba(45,74,30,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗓</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1A2E0E', marginBottom: '4px' }}>Monthly</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#2D4A1E', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>
                  ${SUBSCRIPTION_PRICES.monthly}
                  <span style={{ fontSize: '14px', fontWeight: '400', color: '#7a8a6e' }}>/mo</span>
                </div>
                <p style={{ fontSize: '13px', color: '#4a5a3e', lineHeight: 1.5 }}>
                  Flexible monthly billing. Cancel anytime.
                </p>
                {plan === 'monthly' && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#2D4A1E', fontWeight: '700', backgroundColor: '#EBF2DE', padding: '6px 12px', borderRadius: '20px', display: 'inline-block' }}>
                    ✓ Selected
                  </div>
                )}
              </div>

              {/* Annual */}
              <div
                onClick={() => setPlan('annual')}
                style={{
                  backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
                  border: `2px solid ${plan === 'annual' ? '#2D4A1E' : '#e0dbd0'}`,
                  cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                  boxShadow: plan === 'annual' ? '0 4px 16px rgba(45,74,30,0.15)' : 'none',
                }}
              >
                <div style={{
                  position: 'absolute', top: '-10px', right: '16px',
                  backgroundColor: '#f59e0b', color: '#fff', fontSize: '11px',
                  fontWeight: '700', padding: '3px 12px', borderRadius: '20px',
                }}>
                  SAVE {savings}%
                </div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>⭐</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1A2E0E', marginBottom: '4px' }}>Annual</h3>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#2D4A1E', fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                  ${SUBSCRIPTION_PRICES.annual}
                  <span style={{ fontSize: '14px', fontWeight: '400', color: '#7a8a6e' }}>/year</span>
                </div>
                <div style={{ fontSize: '12px', color: '#7a8a6e', textDecoration: 'line-through', marginBottom: '8px' }}>
                  ${SUBSCRIPTION_PRICES.monthly * 12}/year normally
                </div>
                <p style={{ fontSize: '13px', color: '#4a5a3e', lineHeight: 1.5 }}>
                  Best value. Pay once, sell all year.
                </p>
                {plan === 'annual' && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#2D4A1E', fontWeight: '700', backgroundColor: '#EBF2DE', padding: '6px 12px', borderRadius: '20px', display: 'inline-block' }}>
                    ✓ Selected
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0', padding: '20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A2E0E', marginBottom: '12px' }}>What's included:</p>
              {['Unlimited product listings', 'Your own vendor storefront', 'Order management dashboard', 'Analytics & sales reports', 'Customer messaging', 'Priority support'].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#5C8A2E', fontWeight: '700' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#4a5a3e' }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setStep('payment')} style={{
              width: '100%', backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
              borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '600',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5C8A2E'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D4A1E'}
            >
              Continue to Payment →
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div>
            <button onClick={() => setStep('plan')} style={{ background: 'none', border: 'none', color: '#5C8A2E', fontSize: '14px', cursor: 'pointer', marginBottom: '20px', fontWeight: '600' }}>
              ← Back to Plans
            </button>

            {/* Selected plan summary */}
            <div style={{ backgroundColor: '#EBF2DE', borderRadius: '12px', padding: '16px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#5C8A2E', fontWeight: '600', margin: 0 }}>Selected Plan</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', margin: '2px 0 0' }}>
                  {plan === 'monthly' ? 'Monthly' : 'Annual'} — ${SUBSCRIPTION_PRICES[plan]}
                </p>
              </div>
              <button onClick={() => setStep('plan')} style={{ background: 'none', border: '1.5px solid #5C8A2E', color: '#5C8A2E', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                Change
              </button>
            </div>

            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1A2E0E', marginBottom: '20px' }}>
              Choose Payment Method
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {PAYMENT_METHODS.map(pm => (
                <div
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  style={{
                    backgroundColor: '#fff', borderRadius: '12px', padding: '16px 18px',
                    border: `2px solid ${paymentMethod === pm.id ? '#2D4A1E' : '#e0dbd0'}`,
                    cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{pm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E', margin: 0 }}>{pm.label}</p>
                    <p style={{ fontSize: '13px', color: '#7a8a6e', margin: '2px 0 0' }}>{pm.desc}</p>
                  </div>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    border: `2px solid ${paymentMethod === pm.id ? '#2D4A1E' : '#e0dbd0'}`,
                    backgroundColor: paymentMethod === pm.id ? '#2D4A1E' : 'transparent',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {paymentMethod === pm.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment method specifics */}
            {(paymentMethod === 'wish_money' || paymentMethod === 'omt') && (
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid #e0dbd0', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', marginBottom: '8px' }}>
                  Transfer Details
                </p>
                <div style={{ backgroundColor: '#EBF2DE', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '14px', color: '#2D4A1E', margin: 0 }}>
                    {paymentMethod === 'wish_money' ? '📱 Wish Money: +961 76 123 456' : '🏦 OMT Account: #12345678 — Souqna Lebanon'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#5C8A2E', margin: '4px 0 0', fontWeight: '600' }}>
                    Amount: ${SUBSCRIPTION_PRICES[plan]}
                  </p>
                </div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1A2E0E', marginBottom: '8px' }}>
                  Upload Payment Screenshot *
                </label>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ fontSize: '14px', color: '#4a5a3e' }} />
                {proofFile && (
                  <img src={proofFile} alt="proof" style={{ marginTop: '10px', width: '100px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #e0dbd0' }} />
                )}
              </div>
            )}

            {paymentMethod === 'cash_delivery' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid #e0dbd0', padding: '20px', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A2E0E', marginBottom: '12px' }}>
                  Delivery Address
                </p>
                <textarea
                  placeholder="Enter your full address for cash collection..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <p style={{ fontSize: '12px', color: '#7a8a6e', marginTop: '8px' }}>
                  Our agent will visit within 1–2 business days to collect ${SUBSCRIPTION_PRICES[plan]}.
                </p>
              </div>
            )}

            {paymentMethod === 'credit_card' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid #e0dbd0', padding: '20px', marginBottom: '16px' }}>
                <CardForm />
              </div>
            )}

            {error && (
              <p style={{ color: '#c62828', fontSize: '13px', backgroundColor: '#fce4ec', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px' }}>
                {error}
              </p>
            )}

            <button onClick={handleSubmit} disabled={submitting} style={{
              width: '100%', backgroundColor: submitting ? '#7a8a6e' : '#2D4A1E', color: '#fff',
              border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}>
              {submitting ? <><Spinner size={20} color="#fff" /> Submitting...</> : `Submit Payment — $${SUBSCRIPTION_PRICES[plan]}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionPage
