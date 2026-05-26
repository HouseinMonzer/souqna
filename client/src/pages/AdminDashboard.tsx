import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/admin'
import type { Analytics, Vendor, Product, Order, AuditLog, AdminUser, AdminSubscription, SiteSettings } from '../api/admin'

// ─── Toast System ─────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error'
interface ToastMsg { id: number; message: string; type: ToastType }
let _addToast: ((msg: string, type: ToastType) => void) | null = null

function useToast() {
  return {
    success: (msg: string) => _addToast?.(msg, 'success'),
    error: (msg: string) => _addToast?.(msg, 'error'),
  }
}

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  useEffect(() => {
    _addToast = (message, type) => {
      const id = Date.now()
      setToasts(p => [...p, { id, message, type }])
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200)
    }
    return () => { _addToast = null }
  }, [])
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          backgroundColor: t.type === 'success' ? '#2D4A1E' : '#dc2626',
          color: '#fff', borderRadius: 10, padding: '11px 18px',
          fontSize: 13, fontWeight: 600, boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
          display: 'flex', alignItems: 'center', gap: 8, minWidth: 240,
          animation: 'toastIn 0.28s ease',
        }}>
          <span style={{ fontSize: 16 }}>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, stripe = '#5C8A2E', children }: {
  open: boolean; onClose: () => void; title: string; stripe?: string; children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])
  if (!open) return null
  return (
    <div onClick={e => { if (e.target === ref.current) onClose() }} ref={ref}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 8000, padding: 16 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', animation: 'modalIn 0.22s ease' }}>
        <div style={{ height: 4, backgroundColor: stripe }} />
        <div style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16, margin: 0, paddingBottom: 14 }}>{title}</h3>
          {children}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { bg: string; color: string; dot: string }> = {
  ACTIVE:          { bg: '#EBF2DE', color: '#2D4A1E', dot: '#5C8A2E' },
  active:          { bg: '#EBF2DE', color: '#2D4A1E', dot: '#5C8A2E' },
  PENDING:         { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  pending:         { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  pending_payment: { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  SUSPENDED:       { bg: '#fce7f3', color: '#9d174d', dot: '#ec4899' },
  suspended:       { bg: '#fce7f3', color: '#9d174d', dot: '#ec4899' },
  REJECTED:        { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  rejected:        { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  cancelled:       { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  DELIVERED:       { bg: '#EBF2DE', color: '#2D4A1E', dot: '#5C8A2E' },
  SHIPPED:         { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  PROCESSING:      { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  CONFIRMED:       { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  CANCELLED:       { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  REFUNDED:        { bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
  PAID:            { bg: '#EBF2DE', color: '#2D4A1E', dot: '#5C8A2E' },
  FAILED:          { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  expired:         { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  admin:           { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  vendor:          { bg: '#EBF2DE', color: '#2D4A1E', dot: '#5C8A2E' },
  customer:        { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' },
  DRAFT:           { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' },
  INACTIVE:        { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
}
function StatusBadge({ s }: { s: string }) {
  const cfg = STATUS[s] ?? { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, color: cfg.color, borderRadius: 20, padding: '3px 9px', fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dot, flexShrink: 0 }} />
      {s.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function Spin() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '52px 0' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #e5e7eb', borderTop: '3px solid #5C8A2E', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Empty({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontWeight: 700, color: '#374151', fontSize: 14, marginBottom: 4 }}>{title}</p>
      {sub && <p style={{ color: '#9ca3af', fontSize: 12 }}>{sub}</p>}
    </div>
  )
}

function Card({ children, p = 20, style }: { children: React.ReactNode; p?: number; style?: React.CSSProperties }) {
  return <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: p, ...style }}>{children}</div>
}

const Th = ({ c }: { c: string }) => (
  <th style={{ textAlign: 'left', padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{c}</th>
)
const Td = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle', fontSize: 13, color: '#374151', ...style }}>{children}</td>
)

type BV = 'primary' | 'danger' | 'warn' | 'ghost' | 'success'
const BS: Record<BV, { bg: string; hbg: string; color: string }> = {
  primary: { bg: '#5C8A2E', hbg: '#4a7024', color: '#fff' },
  danger:  { bg: '#fee2e2', hbg: '#fecaca', color: '#dc2626' },
  warn:    { bg: '#fef9c3', hbg: '#fef08a', color: '#92400e' },
  ghost:   { bg: '#f8fafc', hbg: '#f1f5f9', color: '#374151' },
  success: { bg: '#EBF2DE', hbg: '#d4e8c2', color: '#2D4A1E' },
}
function Btn({ v = 'ghost', children, onClick, disabled, sm }: { v?: BV; children: React.ReactNode; onClick?: () => void; disabled?: boolean; sm?: boolean }) {
  const [h, setH] = useState(false)
  const s = BS[v]
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ backgroundColor: h && !disabled ? s.hbg : s.bg, color: s.color, border: 'none', borderRadius: 8, padding: sm ? '4px 10px' : '8px 16px', fontSize: sm ? 11 : 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap', transform: h && !disabled ? 'translateY(-1px)' : 'none' }}>
      {children}
    </button>
  )
}

function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const tp = Math.ceil(total / limit)
  if (tp <= 1) return null
  const start = Math.max(1, Math.min(page - 2, tp - 4))
  const nums = Array.from({ length: Math.min(5, tp) }, (_, i) => start + i)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <PBtn disabled={page === 1} onClick={() => onPage(page - 1)}>←</PBtn>
        {nums.map(n => <PBtn key={n} active={n === page} onClick={() => onPage(n)}>{n}</PBtn>)}
        <PBtn disabled={page === tp} onClick={() => onPage(page + 1)}>→</PBtn>
      </div>
    </div>
  )
}
function PBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ minWidth: 32, height: 32, borderRadius: 7, fontSize: 12, fontWeight: 600, border: active ? 'none' : '1px solid #e2e8f0', backgroundColor: active ? '#5C8A2E' : '#fff', color: active ? '#fff' : disabled ? '#cbd5e1' : '#475569', cursor: disabled ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  )
}

function Input({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  const [focus, setFocus] = useState(false)
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ border: `1.5px solid ${focus ? '#5C8A2E' : '#e2e8f0'}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit', ...style }} />
  )
}

function Sel({ value, onChange, children, style }: { value: string; onChange: (v: string) => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', ...style }}>
      {children}
    </select>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function OverviewTab({ analytics, goVendors }: { analytics: Analytics | null; goVendors: () => void }) {
  if (!analytics) return <Spin />
  const maxRev = Math.max(...(analytics.revenueByMonth?.map(m => m.revenue) ?? [1]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {analytics.pendingVendors > 0 && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>{analytics.pendingVendors} vendor{analytics.pendingVendors > 1 ? 's' : ''} awaiting approval</p>
              <p style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Review and approve or reject pending applications</p>
            </div>
          </div>
          <Btn v="warn" onClick={goVendors} sm>Review Now →</Btn>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
        <StatCard icon="🏪" label="Total Vendors" value={analytics.totalVendors} sub={analytics.pendingVendors > 0 ? `${analytics.pendingVendors} pending` : undefined} subColor="#b45309" />
        <StatCard icon="👥" label="Customers" value={analytics.totalCustomers.toLocaleString()} />
        <StatCard icon="📦" label="Total Orders" value={analytics.totalOrders.toLocaleString()} />
        <StatCard icon="💰" label="Revenue" value={`$${analytics.totalRevenue.toLocaleString()}`} subColor="#2D4A1E" trend="up" sub={analytics.totalRevenue > 0 ? 'All time' : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Orders — Last 7 Days</p>
          {analytics.ordersLast7Days.some(d => d.count > 0) ? <WeekChart data={analytics.ordersLast7Days} /> : <Empty icon="📊" title="No order data yet" />}
        </Card>
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Top Vendors</p>
          {analytics.topVendors.length === 0 ? <Empty icon="🏪" title="No vendors yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analytics.topVendors.map((v, i) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#EBF2DE', color: '#2D4A1E', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.storeName}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{v.orderCount} orders · {v.productCount} products</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2D4A1E' }}>${v.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {analytics.revenueByMonth?.length > 0 && (
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>Revenue — Last 6 Months</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
            {analytics.revenueByMonth.map(m => (
              <div key={`${m.year}-${m.month}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>
                  {m.revenue > 999 ? `$${(m.revenue / 1000).toFixed(1)}k` : `$${m.revenue}`}
                </span>
                <div style={{ width: '100%', borderRadius: '6px 6px 0 0', backgroundColor: '#5C8A2E', height: `${Math.max(Math.round((m.revenue / maxRev) * 100), m.revenue > 0 ? 4 : 0)}px`, transition: 'height 0.4s ease' }} title={`$${m.revenue}`} />
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{MONTHS[m.month - 1]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, subColor, trend }: { icon: string; label: string; value: string | number; sub?: string; subColor?: string; trend?: 'up' | 'down' }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: subColor || '#94a3b8', marginTop: 6 }}>{trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{sub}</p>}
        </div>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
    </Card>
  )
}

function WeekChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 84 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', borderRadius: '4px 4px 0 0', backgroundColor: '#5C8A2E', height: `${Math.max(Math.round((d.count / max) * 68), d.count > 0 ? 3 : 0)}px`, transition: 'height 0.3s' }} title={`${d.count} orders`} />
          <span style={{ fontSize: 9, color: '#94a3b8' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Vendors Tab ─────────────────────────────────────────────────────────────
type VFilter = 'all' | 'pending' | 'active' | 'suspended' | 'rejected'
type VAction = 'approve' | 'reject' | 'suspend' | 'reactivate'

function VendorsTab() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<VFilter>('all')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ id: string; action: VAction; vendor: Vendor } | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await adminApi.getVendors({ search, status: filter === 'all' ? undefined : filter, page, limit: LIMIT })
      setVendors(d.vendors)
      setTotal(d.total)
    } catch { toast.error('Failed to load vendors') }
    finally { setLoading(false) }
  }, [search, filter, page])

  useEffect(() => { setPage(1) }, [search, filter])
  useEffect(() => { load() }, [load])

  const openModal = (v: Vendor, action: VAction) => { setReason(''); setModal({ id: v.id, action, vendor: v }) }
  const needsReason = modal?.action === 'reject' || modal?.action === 'suspend'

  const doAction = async () => {
    if (!modal || busy) return
    if (needsReason && !reason.trim()) return
    setBusy(true)
    try {
      const statusMap: Record<VAction, string> = { approve: 'active', reject: 'rejected', suspend: 'suspended', reactivate: 'active' }
      await adminApi.updateVendorStatus(modal.id, statusMap[modal.action], reason.trim() || undefined)
      const labels: Record<VAction, string> = { approve: 'Vendor approved', reject: 'Vendor rejected', suspend: 'Vendor suspended', reactivate: 'Vendor reactivated' }
      toast.success(labels[modal.action])
      setModal(null)
      load()
    } catch { toast.error('Action failed — please try again') }
    finally { setBusy(false) }
  }

  const stripeColor: Record<VAction, string> = { approve: '#5C8A2E', reject: '#dc2626', suspend: '#f59e0b', reactivate: '#5C8A2E' }
  const FILTERS: { key: VFilter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'active', label: 'Active' },
    { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div>
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal ? `${modal.action.charAt(0).toUpperCase()}${modal.action.slice(1)} Vendor` : ''} stripe={modal ? stripeColor[modal.action] : '#5C8A2E'}>
        {modal && (
          <>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              {modal.vendor.logoUrl
                ? <img src={modal.vendor.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                : <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#2D4A1E' }}>{modal.vendor.storeName.slice(0, 2).toUpperCase()}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', margin: 0 }}>{modal.vendor.storeName}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{modal.vendor.user.email}</p>
              </div>
              <StatusBadge s={modal.vendor.status} />
            </div>

            {modal.action === 'approve' && <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>Approving this vendor will set their status to <strong>Active</strong> and allow them to list products.</p>}
            {modal.action === 'reactivate' && <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>This will restore the vendor to <strong>Active</strong> status and re-enable their store.</p>}

            {needsReason && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Reason <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} autoFocus
                  placeholder={`Explain why you are ${modal.action}ing this vendor...`}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#5C8A2E')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
                {!reason.trim() && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>Reason is required</p>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
              <Btn v="ghost" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn v={modal.action === 'approve' || modal.action === 'reactivate' ? 'primary' : 'danger'} onClick={doAction} disabled={busy || (needsReason && !reason.trim())}>
                {busy ? 'Processing…' : `Confirm ${modal.action.charAt(0).toUpperCase()}${modal.action.slice(1)}`}
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 2, backgroundColor: '#f8fafc', borderRadius: 10, padding: 4 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '5px 13px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', backgroundColor: filter === f.key ? '#5C8A2E' : 'transparent', color: filter === f.key ? '#fff' : '#64748b', transition: 'all 0.15s' }}>{f.label}</button>
            ))}
          </div>
          <Input value={search} onChange={setSearch} placeholder="Search vendors…" style={{ flex: 1, minWidth: 180 }} />
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{total} vendor{total !== 1 ? 's' : ''}</span>
        </div>

        {loading ? <Spin /> : vendors.length === 0 ? <Empty icon="🏪" title="No vendors found" sub="Try different filters" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Vendor','Email','Products','Orders','Revenue','Status','Joined','Actions'].map(c => <Th key={c} c={c} />)}</tr></thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {v.logoUrl ? <img src={v.logoUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#EBF2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#2D4A1E', flexShrink: 0 }}>{v.storeName.slice(0, 2).toUpperCase()}</div>}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{v.storeName}</p>
                          {v.ownerName && <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{v.ownerName}</p>}
                        </div>
                      </div>
                    </Td>
                    <Td style={{ color: '#64748b', maxWidth: 160 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{v.user.email}</span></Td>
                    <Td>{v._count.products}</Td>
                    <Td>{v._count.orders}</Td>
                    <Td style={{ fontWeight: 700, color: '#2D4A1E' }}>${(v.revenue || 0).toLocaleString()}</Td>
                    <Td><StatusBadge s={v.status} /></Td>
                    <Td style={{ color: '#94a3b8', fontSize: 12 }}>{v.joinedAt ? new Date(v.joinedAt).toLocaleDateString() : '—'}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                        {v.status === 'PENDING' && <><Btn v="success" onClick={() => openModal(v, 'approve')} sm>Approve</Btn><Btn v="danger" onClick={() => openModal(v, 'reject')} sm>Reject</Btn></>}
                        {v.status === 'ACTIVE' && <Btn v="warn" onClick={() => openModal(v, 'suspend')} sm>Suspend</Btn>}
                        {(v.status === 'SUSPENDED' || v.status === 'REJECTED') && <Btn v="success" onClick={() => openModal(v, 'reactivate')} sm>Reactivate</Btn>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </Card>
    </div>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await adminApi.getProducts({ status: statusFilter || undefined, search, page, limit: LIMIT })
      setProducts(d.products); setTotal(d.total)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [statusFilter, search, page])

  useEffect(() => { setPage(1) }, [statusFilter, search])
  useEffect(() => { load() }, [load])

  const toggleSuspend = async (p: Product) => {
    try {
      await adminApi.updateProductStatus(p.id, p.status === 'INACTIVE' ? 'unsuspended' : 'suspended')
      toast.success(p.status === 'INACTIVE' ? 'Product unsuspended' : 'Product suspended')
      load()
    } catch { toast.error('Failed to update product') }
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input value={search} onChange={setSearch} placeholder="Search products…" style={{ width: 200 }} />
        <Sel value={statusFilter} onChange={setStatusFilter}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Suspended / Inactive</option>
          <option value="DRAFT">Draft</option>
        </Sel>
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{total} products</span>
      </div>

      {loading ? <Spin /> : products.length === 0 ? <Empty icon="📦" title="No products found" sub="Try different filters" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Product','Vendor','Price','Stock','Sold','Status','Actions'].map(c => <Th key={c} c={c} />)}</tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.image ? <img src={p.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📦</div>}
                      <span style={{ fontWeight: 600, color: '#0f172a', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.name}</span>
                    </div>
                  </Td>
                  <Td style={{ color: '#64748b' }}>{p.vendor.storeName}</Td>
                  <Td style={{ fontWeight: 700 }}>${p.price.toFixed(2)}</Td>
                  <Td>{p.stock}</Td>
                  <Td>{p.totalSold ?? 0}</Td>
                  <Td><StatusBadge s={p.status} /></Td>
                  <Td>
                    {p.status === 'INACTIVE' ? <Btn v="success" onClick={() => toggleSuspend(p)} sm>Unsuspend</Btn>
                      : p.status === 'ACTIVE' ? <Btn v="danger" onClick={() => toggleSuspend(p)} sm>Suspend</Btn>
                      : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
    </Card>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const ORDER_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded']

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const toast = useToast()
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await adminApi.getOrders({ status: statusFilter || undefined, search, page, limit: LIMIT })
      setOrders(d.orders); setTotal(d.total)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }, [statusFilter, search, page])

  useEffect(() => { setPage(1) }, [statusFilter, search])
  useEffect(() => { load() }, [load])

  const changeStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      await adminApi.updateOrderStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status.toUpperCase() } : o))
      toast.success('Order status updated')
    } catch { toast.error('Failed to update order') }
    finally { setUpdating(null) }
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input value={search} onChange={setSearch} placeholder="Search order # or customer…" style={{ width: 220 }} />
        <Sel value={statusFilter} onChange={setStatusFilter}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Sel>
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{total} orders</span>
      </div>

      {loading ? <Spin /> : orders.length === 0 ? <Empty icon="🛍️" title="No orders found" sub="Orders appear here once customers start purchasing" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Order #','Customer','Vendor','Total','Payment','Status','Date','Change'].map(c => <Th key={c} c={c} />)}</tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <Td><span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: 12 }}>{o.orderNumber || `#${o.id.slice(0, 8)}`}</span></Td>
                  <Td style={{ fontWeight: 600, color: '#0f172a' }}>{o.user.name}</Td>
                  <Td style={{ color: '#64748b' }}>{o.vendor.storeName}</Td>
                  <Td style={{ fontWeight: 800, color: '#2D4A1E' }}>${o.total.toFixed(2)}</Td>
                  <Td><StatusBadge s={o.paymentStatus || 'PENDING'} /></Td>
                  <Td><StatusBadge s={o.status} /></Td>
                  <Td style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <select disabled={updating === o.id} value={o.status.toLowerCase()} onChange={e => changeStatus(o.id, e.target.value)}
                      style={{ border: '1.5px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', opacity: updating === o.id ? 0.5 : 1, cursor: updating === o.id ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
    </Card>
  )
}

// ─── Subscriptions Tab ────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const [subs, setSubs] = useState<AdminSubscription[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<{ id: string; note: string } | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try { setSubs(await adminApi.getSubscriptions({ status: statusFilter || undefined })) }
    catch { toast.error('Failed to load subscriptions') }
    finally { setLoading(false) }
  }, [statusFilter])
  useEffect(() => { load() }, [load])

  const doUpdate = async (id: string, status: string, adminNote?: string) => {
    setUpdating(id)
    try {
      await adminApi.updateSubscriptionStatus(id, status, adminNote)
      toast.success(`Subscription ${status}`)
      setNoteModal(null); load()
    } catch { toast.error('Failed to update subscription') }
    finally { setUpdating(null) }
  }

  return (
    <div>
      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title="Reject Subscription" stripe="#dc2626">
        {noteModal && (
          <>
            <textarea value={noteModal.note} onChange={e => setNoteModal({ ...noteModal, note: e.target.value })} rows={3}
              placeholder="Reason for rejection…"
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn v="ghost" onClick={() => setNoteModal(null)}>Cancel</Btn>
              <Btn v="danger" onClick={() => doUpdate(noteModal.id, 'cancelled', noteModal.note)} disabled={updating === noteModal.id}>Confirm Reject</Btn>
            </div>
          </>
        )}
      </Modal>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Vendor Subscriptions ({subs.length})</span>
          <Sel value={statusFilter} onChange={setStatusFilter}>
            <option value="">All statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </Sel>
        </div>

        {loading ? <Spin /> : subs.length === 0 ? <Empty icon="💳" title="No subscriptions found" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Store','Plan','Amount','Payment','Status','Period','Proof','Actions'].map(c => <Th key={c} c={c} />)}</tr></thead>
              <tbody>
                {subs.map(sub => (
                  <tr key={sub.id} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                    <Td style={{ fontWeight: 700, color: '#0f172a' }}>{sub.vendor?.store_name || '—'}</Td>
                    <Td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{sub.plan}</Td>
                    <Td style={{ fontWeight: 700, color: '#2D4A1E' }}>${sub.amount}</Td>
                    <Td style={{ color: '#64748b', textTransform: 'capitalize' }}>{sub.payment_method?.replace(/_/g, ' ') || '—'}</Td>
                    <Td><StatusBadge s={sub.status} /></Td>
                    <Td style={{ fontSize: 11, color: '#94a3b8' }}>
                      <div>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : 'Not started'}</div>
                      {sub.end_date && <div>→ {new Date(sub.end_date).toLocaleDateString()}</div>}
                    </Td>
                    <Td>{sub.payment_proof ? <a href={sub.payment_proof} target="_blank" rel="noopener noreferrer" style={{ color: '#5C8A2E', fontWeight: 600, fontSize: 12 }}>View ↗</a> : <span style={{ color: '#cbd5e1' }}>—</span>}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                        {sub.status === 'pending_payment' && <>
                          <Btn v="success" onClick={() => doUpdate(sub.id, 'active')} disabled={updating === sub.id} sm>Approve</Btn>
                          <Btn v="danger" onClick={() => setNoteModal({ id: sub.id, note: '' })} disabled={updating === sub.id} sm>Reject</Btn>
                        </>}
                        {sub.status === 'active' && <Btn v="ghost" onClick={() => doUpdate(sub.id, 'cancelled')} disabled={updating === sub.id} sm>Cancel</Btn>}
                        {(sub.status === 'expired' || sub.status === 'cancelled') && <Btn v="success" onClick={() => doUpdate(sub.id, 'active')} disabled={updating === sub.id} sm>Reactivate</Btn>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const toast = useToast()
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await adminApi.getUsers({ search, role: roleFilter || undefined, page, limit: LIMIT })
      setUsers(d.users); setTotal(d.total)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [search, roleFilter, page])

  useEffect(() => { setPage(1) }, [search, roleFilter])
  useEffect(() => { load() }, [load])

  const changeRole = async (userId: string, role: 'admin' | 'vendor' | 'customer') => {
    setUpdating(userId)
    try {
      await adminApi.updateUserRole(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Role updated')
    } catch { toast.error('Failed to update role') }
    finally { setUpdating(null) }
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input value={search} onChange={setSearch} placeholder="Search users…" style={{ width: 220 }} />
        <Sel value={roleFilter} onChange={setRoleFilter}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="admin">Admin</option>
        </Sel>
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{total} users</span>
      </div>

      {loading ? <Spin /> : users.length === 0 ? <Empty icon="👥" title="No users found" sub="Try a different search" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Name','Email','Role','Store','Joined','Change Role'].map(c => <Th key={c} c={c} />)}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <Td style={{ fontWeight: 600, color: '#0f172a' }}>{u.fullName || '—'}</Td>
                  <Td style={{ color: '#64748b' }}>{u.email}</Td>
                  <Td><StatusBadge s={u.role} /></Td>
                  <Td style={{ color: '#64748b' }}>{u.storeName || '—'}</Td>
                  <Td style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <select value={u.role} disabled={updating === u.id} onChange={e => changeRole(u.id, e.target.value as 'admin' | 'vendor' | 'customer')}
                      style={{ border: '1.5px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', opacity: updating === u.id ? 0.5 : 1, cursor: updating === u.id ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
    </Card>
  )
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────
const ACTION_ICONS: Record<string, string> = {
  VENDOR_APPROVED: '✅', VENDOR_REJECTED: '❌', VENDOR_SUSPENDED: '🚫', VENDOR_REACTIVATED: '🔄',
  PRODUCT_SUSPENDED: '📦', PRODUCT_UNSUSPENDED: '📦', ORDER_STATUS_CHANGED: '📋',
  USER_ROLE_CHANGED: '👤', SUBSCRIPTION_APPROVED: '💳', SUBSCRIPTION_REJECTED: '💳',
  SUBSCRIPTION_CANCELLED: '💳', SETTINGS_UPDATED: '⚙️', ADMIN_LOGIN: '🔐',
}

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [targetFilter, setTargetFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const LIMIT = 30

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await adminApi.getAuditLogs({ targetType: targetFilter || undefined, page, limit: LIMIT })
      setLogs(d.logs); setTotal(d.total)
    } catch { toast.error('Failed to load audit logs') }
    finally { setLoading(false) }
  }, [targetFilter, page])

  useEffect(() => { setPage(1) }, [targetFilter])
  useEffect(() => { load() }, [load])

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Audit Log ({total})</span>
        <Sel value={targetFilter} onChange={setTargetFilter}>
          <option value="">All types</option>
          <option value="vendor">Vendors</option>
          <option value="product">Products</option>
          <option value="order">Orders</option>
          <option value="settings">Settings</option>
          <option value="subscription">Subscriptions</option>
        </Sel>
      </div>

      {loading ? <Spin /> : logs.length === 0 ? (
        <Empty icon="📋" title="No audit logs yet" sub="Admin actions will be recorded here automatically" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, backgroundColor: '#f8fafc', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f5f9')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{ACTION_ICONS[log.action] ?? '📝'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: '#0f172a', margin: 0 }}>
                  <span style={{ fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#475569' }}>{log.action.replace(/_/g, ' ')}</span>
                  {' on '}
                  <span style={{ fontWeight: 700 }}>{log.targetName}</span>
                  {log.details && (log.details as Record<string, string>).reason && (
                    <span style={{ color: '#64748b' }}> — "{(log.details as Record<string, string>).reason}"</span>
                  )}
                </p>
                {log.ipAddress && <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>IP: {log.ipAddress}</p>}
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
    </Card>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState<Omit<SiteSettings, 'id'>>({
    siteName: 'SouQna', currency: 'USD', commissionRate: 10, autoApproveVendors: false, maintenanceMode: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    adminApi.getSettings().then(d => { if (d) setSettings({ siteName: d.siteName, currency: d.currency, commissionRate: d.commissionRate, autoApproveVendors: d.autoApproveVendors, maintenanceMode: d.maintenanceMode }) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { await adminApi.updateSettings(settings); toast.success('Settings saved successfully') }
    catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  if (loading) return <Spin />

  return (
    <Card style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Site Settings</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Site Name">
          <input value={settings.siteName} onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))} style={INP} />
        </Field>
        <Field label="Currency">
          <select value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} style={INP}>
            <option value="USD">USD — US Dollar</option>
            <option value="LBP">LBP — Lebanese Pound</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </Field>
        <Field label="Commission Rate (%)" hint="Percentage taken from each vendor sale">
          <input type="number" min={0} max={100} step={0.5} value={settings.commissionRate}
            onChange={e => setSettings(s => ({ ...s, commissionRate: Number(e.target.value) }))} style={INP} />
        </Field>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Toggle label="Auto-Approve Vendors" desc="New vendor applications are approved automatically without admin review"
            checked={settings.autoApproveVendors} onChange={v => setSettings(s => ({ ...s, autoApproveVendors: v }))} />
          <Toggle label="Maintenance Mode" desc="Show a maintenance notice to all non-admin visitors"
            checked={settings.maintenanceMode} onChange={v => setSettings(s => ({ ...s, maintenanceMode: v }))} danger />
        </div>
        <div><Btn v="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Btn></div>
      </div>
    </Card>
  )
}

const INP: React.CSSProperties = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, marginTop: 0 }}>{hint}</p>}
      {children}
    </div>
  )
}

function Toggle({ label, desc, checked, onChange, danger }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, color: danger && checked ? '#dc2626' : '#0f172a', margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: checked ? (danger ? '#dc2626' : '#5C8A2E') : '#e2e8f0', position: 'relative', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
type Tab = 'overview' | 'vendors' | 'products' | 'orders' | 'subscriptions' | 'users' | 'audit' | 'settings'
const NAV: { key: Tab; icon: string; label: string }[] = [
  { key: 'overview',      icon: '◈', label: 'Overview' },
  { key: 'vendors',       icon: '🏪', label: 'Vendors' },
  { key: 'products',      icon: '📦', label: 'Products' },
  { key: 'orders',        icon: '🛍️', label: 'Orders' },
  { key: 'subscriptions', icon: '💳', label: 'Subscriptions' },
  { key: 'users',         icon: '👥', label: 'Users' },
  { key: 'audit',         icon: '📋', label: 'Audit Log' },
  { key: 'settings',      icon: '⚙️', label: 'Settings' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/sign-in')
    if (!authLoading && user && user.profile?.role !== 'admin') navigate('/')
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (user?.profile?.role === 'admin') {
      adminApi.getAnalytics().then(setAnalytics).catch(console.error)
    }
  }, [user])

  if (authLoading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1A2E0A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(200,216,168,0.15)', borderTop: '3px solid #C8D8A8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: 'rgba(200,216,168,0.5)', fontSize: 14 }}>Loading admin panel…</p>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1A2E0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(200,216,168,0.7)', fontSize: 16 }}>Redirecting…</p>
    </div>
  )

  const pendingBadge = analytics?.pendingVendors && analytics.pendingVendors > 0 ? analytics.pendingVendors : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex' }}>
      <ToastContainer />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'none' }}
          className="lg:block"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 220, backgroundColor: '#1A2E0A', display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(0)',
        transition: 'transform 0.25s',
      }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(200,216,168,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#5C8A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛒</div>
            <div>
              <p style={{ color: '#C8D8A8', fontWeight: 800, fontSize: 15, margin: 0, letterSpacing: '-0.02em' }}>SouQna</p>
              <p style={{ color: 'rgba(200,216,168,0.4)', fontSize: 10, margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          {NAV.map(n => {
            const active = tab === n.key
            const showBadge = n.key === 'vendors' && pendingBadge
            return (
              <button key={n.key} onClick={() => { setTab(n.key); setSidebarOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', fontSize: 13, cursor: 'pointer', marginBottom: 2,
                  backgroundColor: active ? 'rgba(92,138,46,0.3)' : 'transparent',
                  color: active ? '#C8D8A8' : 'rgba(200,216,168,0.55)',
                  fontWeight: active ? 700 : 500, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 9,
                  borderLeft: active ? '3px solid #5C8A2E' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#C8D8A8' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(200,216,168,0.55)' } }}
              >
                <span style={{ fontSize: 15 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {showBadge && (
                  <span style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{showBadge}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(200,216,168,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#5C8A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {(user.email || 'A').charAt(0).toUpperCase()}
            </div>
            <p style={{ color: 'rgba(200,216,168,0.6)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{user.email}</p>
          </div>
          <button onClick={() => navigate('/')}
            style={{ color: 'rgba(200,216,168,0.4)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C8D8A8')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,216,168,0.4)')}>
            ← Back to site
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 220, minWidth: 0 }}>
        <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'capitalize' }}>
              {NAV.find(n => n.key === tab)?.label ?? tab}
            </h1>
            {tab === 'vendors' && analytics?.pendingVendors ? (
              <span style={{ backgroundColor: '#fef9c3', color: '#92400e', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {analytics.pendingVendors} pending
              </span>
            ) : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {tab === 'overview'       && <OverviewTab analytics={analytics} goVendors={() => setTab('vendors')} />}
          {tab === 'vendors'        && <VendorsTab />}
          {tab === 'products'       && <ProductsTab />}
          {tab === 'orders'         && <OrdersTab />}
          {tab === 'subscriptions'  && <SubscriptionsTab />}
          {tab === 'users'          && <UsersTab />}
          {tab === 'audit'          && <AuditTab />}
          {tab === 'settings'       && <SettingsTab />}
        </main>
      </div>
    </div>
  )
}
