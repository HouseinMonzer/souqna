import React from 'react'

// ─── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = '#5C8A2E' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: {
  width?: string | number; height?: number; borderRadius?: number; style?: React.CSSProperties
}) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, #e8e3d8 25%, #f5f0e8 50%, #e8e3d8 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      ...style,
    }}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  )
}

// ─── ProductCardSkeleton ─────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1.5px solid #e0dbd0', overflow: 'hidden' }}>
      <Skeleton height={200} borderRadius={0} />
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton height={18} width="75%" />
        <Skeleton height={14} width="50%" />
        <Skeleton height={14} width="40%" />
      </div>
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon = '📦', title, message, action, actionLabel,
}: {
  icon?: string; title: string; message?: string; action?: () => void; actionLabel?: string
}) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
    }}>
      <div style={{ fontSize: '56px', lineHeight: 1 }}>{icon}</div>
      <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1A2E0E', fontFamily: 'Georgia, serif', margin: 0 }}>
        {title}
      </h3>
      {message && <p style={{ fontSize: '14px', color: '#7a8a6e', margin: 0, maxWidth: '320px' }}>{message}</p>}
      {action && actionLabel && (
        <button onClick={action} style={{
          marginTop: '8px', backgroundColor: '#2D4A1E', color: '#fff', border: 'none',
          borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600',
          cursor: 'pointer', transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5C8A2E'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2D4A1E'}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue'
const badgeColors: Record<BadgeVariant, { bg: string; color: string }> = {
  green: { bg: '#EBF2DE', color: '#2D4A1E' },
  yellow: { bg: '#fff8e1', color: '#b7791f' },
  red: { bg: '#fce4ec', color: '#c62828' },
  gray: { bg: '#f5f5f5', color: '#5a5a5a' },
  blue: { bg: '#e3f2fd', color: '#1565c0' },
}
export function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  const { bg, color } = badgeColors[variant]
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700', backgroundColor: bg, color,
      letterSpacing: '0.03em', textTransform: 'uppercase',
    }}>
      {children}
    </span>
  )
}

// ─── Stars ───────────────────────────────────────────────────────────────────
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#d4cfc0', fontSize: size }}>★</span>
      ))}
    </span>
  )
}

// ─── Toast (simple notification) ─────────────────────────────────────────────
let toastTimeout: ReturnType<typeof setTimeout> | null = null
let setToastFn: ((msg: string | null) => void) | null = null

export function useToast() {
  const show = (message: string, duration = 3000) => {
    setToastFn?.(message)
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => setToastFn?.(null), duration)
  }
  return { show }
}

export function ToastProvider() {
  const [message, setMessage] = React.useState<string | null>(null)
  React.useEffect(() => { setToastFn = setMessage; return () => { setToastFn = null } }, [])
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#1A2E0E', color: '#fff', borderRadius: '10px',
      padding: '12px 24px', fontSize: '14px', fontWeight: '600',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999,
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
      {message}
    </div>
  )
}
