import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types/database.types'

function FullPageSpinner({ label }: { label: string }) {
  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #5C8A2E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#4a5a3e', fontSize: '15px' }}>{label}</p>
      </div>
    </div>
  )
}

interface RequireAuthProps {
  children: ReactNode
  requireRole?: UserRole
}

export function RequireAuth({ children, requireRole }: RequireAuthProps) {
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)

  if (loading) return <FullPageSpinner label="Loading..." />
  if (!user) return <Navigate to="/sign-in" replace />

  if (requireRole && user.profile?.role !== requireRole) return <Navigate to="/" replace />

  return <>{children}</>
}

export default RequireAuth
