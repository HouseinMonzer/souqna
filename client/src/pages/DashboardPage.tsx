import { useEffect, useState } from 'react'
import type React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { productService } from '../api/products'
import { useAuthStore } from '../store/authStore'
import { Spinner } from '../components/ui'
import { compressImage, ImagePresets } from '../lib/imageUtils'
import type { Product, ProductInsert, VendorSubscription } from '../types/database.types'

const emptyVendorForm = { storeName: '', description: '', category: '', location: '', phone: '' }
const emptyProductForm = { name: '', description: '', price: '', category: '', stock: '0', imageUrl: '' }
const productCategories = ['Organic', 'Food', 'Electronics', 'Beauty', 'Home', 'Fashion', 'Crafts', 'Other']

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#1A2E0E', marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #e0dbd0', fontSize: '14px', color: '#1A2E0E', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: '#fff' }

// ─── Image upload helper ────────────────────────────────────────────────────
function ImageUploadField({ value, onChange, label, preset = 'cover' }: { value: string; onChange: (url: string) => void; label: string; preset?: 'cover' | 'logo' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return }
    setError('')
    setUploading(true)
    try {
      const dataUrl = await compressImage(file, ImagePresets[preset])
      onChange(dataUrl)
    } catch {
      setError('Failed to process image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={value} alt="Preview" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1.5px solid #e0dbd0', display: 'block' }} />
          <button type="button" onClick={() => onChange('')} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#c62828', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>×</button>
          <label style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#5C8A2E', cursor: 'pointer', fontWeight: '600' }}>
            Change
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </div>
      ) : (
        <div style={{ border: '2px dashed #c8d8a8', borderRadius: '10px', padding: '20px', textAlign: 'center', backgroundColor: '#f8faf5', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#5C8A2E')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#c8d8a8')}
        >
          {uploading ? <Spinner /> : (
            <>
              <p style={{ fontSize: '13px', color: '#4a5a3e', marginBottom: '10px' }}>🖼️ Drag & drop or browse</p>
              <label style={{ display: 'inline-block', backgroundColor: '#2D4A1E', color: '#fff', borderRadius: '7px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Browse File
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              <p style={{ fontSize: '11px', color: '#7a8a6e', marginTop: '8px' }}>PNG, JPG, WebP — max 5MB</p>
            </>
          )}
        </div>
      )}
      {error && <p style={{ fontSize: '12px', color: '#c62828', marginTop: '6px', backgroundColor: '#fce4ec', padding: '6px 10px', borderRadius: '6px' }}>{error}</p>}
    </div>
  )
}

// ─── ProductImageUpload (uploads through server → UploadThing) ──────────────
function ProductImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return }
    setError('')
    setUploading(true)
    try {
      const dataUrl = await compressImage(file, ImagePresets.product)
      const json = await apiFetch<{ url: string; publicId?: string }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ imageData: dataUrl, folder: 'products' }),
      })
      if (!json.url) throw new Error('Upload failed')
      onChange(json.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label style={labelStyle}>Product Image</label>
      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={value} alt="Product" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1.5px solid #e0dbd0', display: 'block' }} />
          <button type="button" onClick={() => onChange('')} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#c62828', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>×</button>
          <label style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#5C8A2E', cursor: 'pointer', fontWeight: '600' }}>
            Change image
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </div>
      ) : (
        <div
          style={{ border: '2px dashed #c8d8a8', borderRadius: '10px', padding: '28px 16px', textAlign: 'center', backgroundColor: '#f8faf5', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#5C8A2E')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#c8d8a8')}
        >
          {uploading ? <Spinner /> : (
            <>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
              <p style={{ fontSize: '13px', color: '#4a5a3e', marginBottom: '12px' }}>Drag & drop an image here</p>
              <label style={{ display: 'inline-block', backgroundColor: '#2D4A1E', color: '#fff', borderRadius: '7px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Browse File
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              <p style={{ fontSize: '11px', color: '#7a8a6e', marginTop: '8px' }}>PNG, JPG, WebP — max 5MB</p>
            </>
          )}
        </div>
      )}
      {error && <p style={{ fontSize: '12px', color: '#c62828', marginTop: '6px', backgroundColor: '#fce4ec', padding: '6px 10px', borderRadius: '6px' }}>{error}</p>}
    </div>
  )
}

type VendorDashboard = {
  id: string; name: string; category: string; location: string | null
  description: string | null; sales: number; rating: number; products: Product[]
  slug?: string; phone?: string | null; website?: string | null
  whatsapp?: string | null; instagram?: string | null; facebook?: string | null
  tiktok?: string | null; youtube?: string | null
  logo_url?: string | null; cover_url?: string | null
}

function BecomeVendorForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState(emptyVendorForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { loadUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.storeName.trim()) return setError('Store name is required')
    setSaving(true)
    setError('')
    try {
      await apiFetch('/api/vendor/setup', { method: 'POST', body: JSON.stringify(form) })
      await loadUser()
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#2D4A1E', padding: '36px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ color: '#A3C46C', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Vendor Program</p>
          <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '700' }}>Start Selling on SouQna</h1>
          <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: '14px', marginTop: '8px' }}>Set up your vendor store and reach thousands of customers.</p>
        </div>
      </div>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Store Name *</label>
            <input placeholder="e.g. Zaatar & More" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              <option value="">Select a category</option>
              {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea placeholder="Tell customers about your store..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input placeholder="Beirut, Lebanon" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input placeholder="+961 ..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
            </div>
          </div>
          {error && <p style={{ color: '#c62828', fontSize: '13px', backgroundColor: '#fce4ec', padding: '10px 14px', borderRadius: '8px' }}>{error}</p>}
          <button type="submit" disabled={saving} style={{ backgroundColor: saving ? '#7a8a6e' : '#2D4A1E', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? <><Spinner size={18} color="#fff" /> Creating...</> : 'Create My Store'}
          </button>
        </form>
      </div>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const [vendor, setVendor] = useState<VendorDashboard | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyProductForm)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'add' | 'profile'>('overview')
  const [showBecomeVendor, setShowBecomeVendor] = useState(false)
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null)

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    storeName: '', description: '', location: '', phone: '', website: '',
    whatsapp: '', instagram: '', facebook: '', tiktok: '', youtube: '',
  })
  const [coverData, setCoverData] = useState('')
  const [logoData, setLogoData] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await apiFetch<{ success: boolean; data: VendorDashboard }>('/api/vendor/me')
      const vd = response.data
      setVendor(vd)
      setProducts(vd.products || [])
      setProfileForm({
        storeName: vd.name || '',
        description: vd.description || '',
        location: vd.location || '',
        phone: vd.phone || '',
        website: vd.website || '',
        whatsapp: vd.whatsapp || '',
        instagram: vd.instagram || '',
        facebook: vd.facebook || '',
        tiktok: vd.tiktok || '',
        youtube: vd.youtube || '',
      })
      // Load subscription
      try {
        const subRes = await apiFetch<{ data: VendorSubscription | null }>('/api/subscriptions/my')
        setSubscription(subRes.data)
      } catch { /* no subscription yet */ }
    } catch {
      setShowBecomeVendor(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Vendor Dashboard | SouqNa'
    if (!authLoading && !user) { navigate('/sign-in'); return }
    if (user) loadData()
  }, [authLoading, user, navigate])

  const handleVendorCreated = () => { setShowBecomeVendor(false); loadData() }

  const handleSubmit = async () => {
    if (!form.name || !form.price) { setAddError('Product name and price are required'); return }
    setSaving(true)
    setAddError('')
    const payload: ProductInsert = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      category: form.category || null,
      stock: Number(form.stock || 0),
      imageUrl: form.imageUrl || null,
    }
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, payload)
      } else {
        await productService.create(payload)
      }
      setForm(emptyProductForm)
      setEditingProduct(null)
      setActiveTab('products')
      loadData()
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to save product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category: product.categories?.name || product.category?.name || '',
      stock: String(product.stock || 0),
      imageUrl: product.primary_image || '',
    })
    setActiveTab('add')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await productService.delete(id)
    loadData()
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess(false)
    try {
      await apiFetch('/api/vendor/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          storeName: profileForm.storeName,
          description: profileForm.description || null,
          location: profileForm.location || null,
          phone: profileForm.phone || null,
          website: profileForm.website || null,
          whatsapp: profileForm.whatsapp || null,
          instagram: profileForm.instagram || null,
          facebook: profileForm.facebook || null,
          tiktok: profileForm.tiktok || null,
          youtube: profileForm.youtube || null,
        }),
      })
      if (coverData) {
        await apiFetch('/api/vendor/cover', { method: 'POST', body: JSON.stringify({ imageData: coverData }) })
        setCoverData('')
      }
      if (logoData) {
        await apiFetch('/api/vendor/logo', { method: 'POST', body: JSON.stringify({ imageData: logoData }) })
        setLogoData('')
      }
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
      loadData()
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setProfileSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <Spinner size={32} />
        <p style={{ color: '#7a8a6e', fontSize: '16px' }}>Loading dashboard...</p>
      </div>
    )
  }

  if (showBecomeVendor) return <BecomeVendorForm onSuccess={handleVendorCreated} />

  const subStatus = subscription?.status
  const subActive = subStatus === 'active'

  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#2D4A1E', padding: '28px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: '#A3C46C', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Vendor Dashboard</p>
            <h1 style={{ color: '#F7F2E8', fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '700' }}>
              {vendor?.name || user?.profile?.full_name || user?.email}
            </h1>
            <p style={{ color: 'rgba(247,242,232,0.6)', fontSize: '13px', marginTop: '2px' }}>
              {vendor?.location || 'Lebanon'} · {vendor?.category || 'General'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {vendor?.slug && (
              <Link to={`/vendors/${vendor.slug}`} style={{ fontSize: '13px', color: '#A3C46C', textDecoration: 'none', padding: '8px 16px', backgroundColor: 'rgba(163,196,108,0.15)', borderRadius: '8px', fontWeight: '600' }}>
                View My Shop →
              </Link>
            )}
            {!subActive && (
              <Link to="/subscribe" style={{ fontSize: '13px', color: '#fff', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#f59e0b', borderRadius: '8px', fontWeight: '700' }}>
                {subStatus === 'pending_payment' ? '⏳ Subscription Pending' : '⭐ Subscribe to Sell'}
              </Link>
            )}
            <button onClick={() => { setEditingProduct(null); setForm(emptyProductForm); setActiveTab('add') }} style={{ backgroundColor: '#5C8A2E', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              + Add Product
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Products', val: products.length, icon: '📦' },
            { label: 'Total Sales', val: vendor?.sales || 0, icon: '🛍️' },
            { label: 'Rating', val: vendor?.rating ? `${vendor.rating.toFixed(1)} ★` : 'N/A', icon: '⭐' },
            { label: 'Subscription', val: subActive ? 'Active' : subStatus === 'pending_payment' ? 'Pending' : 'None', icon: subActive ? '✅' : '⚠️' },
          ].map(stat => (
            <div key={stat.label} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid #e0dbd0', padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif' }}>{stat.val}</div>
              <div style={{ fontSize: '12px', color: '#7a8a6e', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'overview', label: '🏠 Overview' },
            { key: 'products', label: `📦 Products (${products.length})` },
            { key: 'add', label: editingProduct ? '✏️ Edit Product' : '➕ Add Product' },
            { key: 'profile', label: '⚙️ Store Settings' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key as typeof activeTab); setAddError(''); if (tab.key !== 'add') { setEditingProduct(null); setForm(emptyProductForm) } }}
              style={{
                padding: '9px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                border: activeTab === tab.key ? 'none' : '1.5px solid #e0dbd0',
                backgroundColor: activeTab === tab.key ? '#2D4A1E' : '#fff',
                color: activeTab === tab.key ? '#F7F2E8' : '#1A2E0E',
                transition: 'all 0.15s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1A2E0E', marginBottom: '16px' }}>Store Overview</h2>
            {vendor?.cover_url && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', height: '160px' }}>
                <img src={vendor.cover_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: '#2D4A1E', flexShrink: 0, border: '2px solid #e0dbd0' }}>
                {vendor?.logo_url ? <img src={vendor.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : vendor?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1A2E0E', margin: 0 }}>{vendor?.name}</h3>
                <p style={{ fontSize: '13px', color: '#7a8a6e', margin: '2px 0 0' }}>{vendor?.location} · {vendor?.category}</p>
              </div>
            </div>
            <p style={{ color: '#4a5a3e', lineHeight: 1.7, marginBottom: '16px' }}>{vendor?.description || 'No description yet.'}</p>
            {!subActive && (
              <div style={{ backgroundColor: '#fff8e1', borderRadius: '10px', padding: '14px 16px', border: '1.5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '14px', color: '#92400e', fontWeight: '600', margin: 0 }}>
                  {subStatus === 'pending_payment' ? '⏳ Your subscription is pending admin approval.' : '⚠️ Subscribe to unlock all vendor features and start selling.'}
                </p>
                {subStatus !== 'pending_payment' && (
                  <Link to="/subscribe" style={{ fontSize: '13px', color: '#fff', backgroundColor: '#f59e0b', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', flexShrink: 0 }}>
                    Subscribe Now
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>📦</p>
                <p style={{ fontSize: '16px', color: '#1A2E0E', fontWeight: '600', marginBottom: '8px' }}>No products yet</p>
                <p style={{ fontSize: '14px', color: '#7a8a6e', marginBottom: '20px' }}>Add your first product to start selling</p>
                <button onClick={() => setActiveTab('add')} style={{ backgroundColor: '#2D4A1E', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Add First Product
                </button>
              </div>
            ) : products.map(product => (
              <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid #e0dbd0', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', backgroundColor: '#EBF2DE', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  {product.primary_image ? <img src={product.primary_image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛍️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A2E0E', marginBottom: '3px', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h3>
                  <p style={{ fontSize: '12px', color: '#7a8a6e' }}>{product.categories?.name || product.category?.name || 'Uncategorized'} · ${Number(product.price).toFixed(2)} · Stock: {product.stock}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: product.status === 'active' ? '#EBF2DE' : '#f5f5f5', color: product.status === 'active' ? '#2D4A1E' : '#7a8a6e' }}>{product.status}</span>
                  <button onClick={() => handleEdit(product)} style={{ backgroundColor: '#EBF2DE', color: '#2D4A1E', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(product.id)} style={{ backgroundColor: '#fce4ec', color: '#c62828', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Product */}
        {activeTab === 'add' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0', padding: '28px', maxWidth: '600px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1A2E0E', marginBottom: '24px' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input placeholder="Product name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="number" placeholder="Price *" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle} />
              </div>
              <ProductImageUpload value={form.imageUrl} onChange={url => setForm({ ...form, imageUrl: url })} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                <option value="">Select category</option>
                {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {addError && <p style={{ color: '#c62828', fontSize: '13px', backgroundColor: '#fce4ec', padding: '10px 14px', borderRadius: '8px', margin: 0 }}>{addError}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, backgroundColor: saving ? '#7a8a6e' : '#2D4A1E', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '15px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? <><Spinner size={18} color="#fff" /> Saving...</> : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button onClick={() => { setActiveTab('products'); setEditingProduct(null); setForm(emptyProductForm) }} style={{ backgroundColor: '#fff', color: '#7a8a6e', border: '1.5px solid #e0dbd0', borderRadius: '8px', padding: '13px 20px', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile / Store Settings */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1.5px solid #e0dbd0', padding: '28px', maxWidth: '700px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1A2E0E', marginBottom: '24px' }}>
              Store Settings
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Cover & Logo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <ImageUploadField
                  label="Cover Photo (1920×720 recommended)"
                  value={coverData || vendor?.cover_url || ''}
                  onChange={setCoverData}
                  preset="cover"
                />
                <ImageUploadField
                  label="Store Logo (square)"
                  value={logoData || vendor?.logo_url || ''}
                  onChange={setLogoData}
                  preset="logo"
                />
              </div>

              <div>
                <label style={labelStyle}>Store Name</label>
                <input value={profileForm.storeName} onChange={e => setProfileForm({ ...profileForm, storeName: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} placeholder="Beirut, Lebanon" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+961..." style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input value={profileForm.whatsapp} onChange={e => setProfileForm({ ...profileForm, whatsapp: e.target.value })} placeholder="+961..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input value={profileForm.website} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })} placeholder="https://..." style={inputStyle} />
                </div>
              </div>

              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A2E0E', marginBottom: '10px' }}>Social Media</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { key: 'instagram', label: '📸 Instagram', placeholder: '@username or URL' },
                    { key: 'facebook', label: '👥 Facebook', placeholder: 'URL or username' },
                    { key: 'tiktok', label: '🎵 TikTok', placeholder: '@username' },
                    { key: 'youtube', label: '▶️ YouTube', placeholder: 'Channel URL' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        value={profileForm[key as keyof typeof profileForm]}
                        onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        placeholder={placeholder}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {profileError && <p style={{ color: '#c62828', fontSize: '13px', backgroundColor: '#fce4ec', padding: '10px 14px', borderRadius: '8px' }}>{profileError}</p>}
              {profileSuccess && <p style={{ color: '#2D4A1E', fontSize: '13px', backgroundColor: '#EBF2DE', padding: '10px 14px', borderRadius: '8px' }}>✓ Profile saved successfully!</p>}

              <button onClick={handleSaveProfile} disabled={profileSaving} style={{
                backgroundColor: profileSaving ? '#7a8a6e' : '#2D4A1E', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600',
                cursor: profileSaving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {profileSaving ? <><Spinner size={18} color="#fff" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
