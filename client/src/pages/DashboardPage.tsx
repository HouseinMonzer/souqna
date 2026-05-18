import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const API_BASE = 'http://localhost:5000/api'

const categories = ['Organic', 'Food', 'Electronics', 'Beauty', 'Home', 'Fashion']
const emojis = ['🫒', '🌿', '🍯', '🧼', '🪔', '🎧', '🔊', '✨', '🌹', '☕', '🍃', '🫙', '📦']

const emptyForm = { name: '', description: '', price: '', emoji: '📦', category: 'Food', badge: '' }
type VendorProduct = {
  id: number
  name: string
  description: string
  price: number
  emoji: string
  badge: string | null
  category: string
  rating?: number
  reviews?: number
  vendorId?: number
  vendor?: string
}

type VendorData = {
  id: number
  name: string
  initials?: string
  color?: string
  category: string
  rating?: number
  sales?: number
  products?: number
  location?: string
  description?: string
  joined?: string
  createdAt?: string
  products: VendorProduct[]
}


async function fetchVendorData(token: string | null) {
  const res = await fetch(`${API_BASE}/vendor/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.json()
}

async function addProduct(token: string | null, data: any) {
  const res = await fetch(`${API_BASE}/vendor/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function updateProduct(id: number, token: string | null, data: any) {
  const res = await fetch(`${API_BASE}/vendor/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function deleteProduct(id: number, token: string | null) {
  const res = await fetch(`${API_BASE}/vendor/products/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.json()
}
function DashboardPage() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [vendor, setVendor] = useState<any>(null)
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'add'>('overview')

  // لو ما في token — روح للـ login
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const res = await fetchVendorData()
    if (res.success) {
      setVendor(res.data)
      setProducts(res.data.products || [])
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.price || !form.category) return
    setSaving(true)

    const data = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      emoji: form.emoji,
      category: form.category,
      badge: form.badge || null,
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, data)
    } else {
      await addProduct(data)
    }

    setSaving(false)
    setForm(emptyForm)
    setEditingProduct(null)
    setShowForm(false)
    setActiveTab('products')
    loadData()
  }

  const handleEdit = (product: VendorProduct) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      emoji: product.emoji,
      category: product.category,
      badge: product.badge || '',
    })
    setActiveTab('add')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    loadData()
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7a8a6e', fontSize: '16px' }}>⏳ Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A1E', padding: '28px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: '#A3C46C', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Vendor Dashboard
            </p>
            <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700' }}>
              {vendor?.name || user?.name}
            </h1>
            <p style={{ color: 'rgba(247,242,232,0.6)', fontSize: '13px', marginTop: '2px' }}>
              📍 {vendor?.location} · {vendor?.category}
            </p>
          </div>
          <button
            onClick={() => { setEditingProduct(null); setForm(emptyForm); setActiveTab('add') }}
            style={{
              backgroundColor: '#5C8A2E', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '11px 22px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer',
            }}
          >
            + Add Product
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Total Products', val: products.length, icon: '📦' },
            { label: 'Total Sales', val: vendor?.sales || 0, icon: '💰' },
            { label: 'Rating', val: vendor?.rating ? `${vendor.rating} ★` : 'N/A', icon: '⭐' },
            { label: 'Category', val: vendor?.category, icon: '🏷️' },
          ].map(s => (
            <div key={s.label} style={{
              backgroundColor: '#fff', borderRadius: '12px',
              border: '1.5px solid #e0dbd0', padding: '18px 20px',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '12px', color: '#7a8a6e', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'products', label: `Products (${products.length})` },
            { key: 'add', label: editingProduct ? 'Edit Product' : 'Add Product' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any)
                if (tab.key !== 'add') { setEditingProduct(null); setForm(emptyForm) }
              }}
              style={{
                padding: '9px 20px', borderRadius: '8px', fontSize: '14px',
                fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                border: activeTab === tab.key ? 'none' : '1.5px solid #e0dbd0',
                backgroundColor: activeTab === tab.key ? '#2D4A1E' : '#fff',
                color: activeTab === tab.key ? '#F7F2E8' : '#1A2E0E',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1A2E0E', marginBottom: '16px' }}>
              Store Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              {[
                { label: 'Store Name', val: vendor?.name },
                { label: 'Category', val: vendor?.category },
                { label: 'Location', val: vendor?.location },
                { label: 'Member Since', val: new Date(vendor?.createdAt).toLocaleDateString() },
                { label: 'Total Products', val: products.length },
                { label: 'Description', val: vendor?.description || 'No description yet' },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px', backgroundColor: '#F7F2E8', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#7a8a6e', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ color: '#1A2E0E', fontWeight: '500' }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <p style={{ fontSize: '16px', color: '#1A2E0E', fontWeight: '600', marginBottom: '8px' }}>No products yet</p>
                <p style={{ fontSize: '14px', color: '#7a8a6e', marginBottom: '20px' }}>Add your first product</p>
                <button
                  onClick={() => setActiveTab('add')}
                  style={{ backgroundColor: '#2D4A1E', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  + Add Product
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {products.map(product => (
                  <div key={product.id} style={{
                    backgroundColor: '#fff', borderRadius: '12px',
                    border: '1.5px solid #e0dbd0', padding: '16px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                  }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '10px',
                      backgroundColor: '#EBF2DE', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '28px', flexShrink: 0,
                    }}>
                      {product.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E', marginBottom: '3px', fontFamily: 'Georgia, serif' }}>
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#7a8a6e' }}>
                        {product.category} · ${Number(product.price).toFixed(2)}
                        {product.badge && (
                          <span style={{ marginLeft: '8px', backgroundColor: '#EBF2DE', color: '#2D4A1E', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                            {product.badge}
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          backgroundColor: '#EBF2DE', color: '#2D4A1E',
                          border: 'none', borderRadius: '7px', padding: '7px 14px',
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{
                          backgroundColor: '#fce4ec', color: '#c62828',
                          border: 'none', borderRadius: '7px', padding: '7px 14px',
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Tab */}
        {activeTab === 'add' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0', padding: '28px', maxWidth: '600px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1A2E0E', marginBottom: '24px' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Emoji picker */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '8px' }}>
                  Product Emoji
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {emojis.map(e => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, emoji: e })}
                      style={{
                        width: '40px', height: '40px', borderRadius: '8px', fontSize: '20px',
                        border: form.emoji === e ? '2px solid #5C8A2E' : '1.5px solid #e0dbd0',
                        backgroundColor: form.emoji === e ? '#EBF2DE' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Olive Oil 500ml"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>Description *</label>
                <textarea
                  placeholder="Describe your product..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
                />
              </div>

              {/* Price + Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>Price ($) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#5C8A2E'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e0dbd0'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Badge */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1A2E0E', display: 'block', marginBottom: '6px' }}>Badge (optional)</label>
                <select
                  value={form.badge}
                  onChange={e => setForm({ ...form, badge: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                >
                  <option value="">No badge</option>
                  {['Bestseller', 'New', 'Top Rated', 'Handmade', 'Deal'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    flex: 1, backgroundColor: saving ? '#7a8a6e' : '#2D4A1E',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '13px', fontSize: '15px', fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : editingProduct ? '✓ Update Product' : '+ Add Product'}
                </button>
                <button
                  onClick={() => { setActiveTab('products'); setEditingProduct(null); setForm(emptyForm) }}
                  style={{
                    backgroundColor: '#fff', color: '#7a8a6e',
                    border: '1.5px solid #e0dbd0', borderRadius: '8px',
                    padding: '13px 20px', fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default DashboardPage