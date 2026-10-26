import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Spinner } from './ui'
import type { UserRole } from '../types/database.types'

interface RequireAuthProps {
  children: ReactNode
  requireRole?: UserRole
}

export function RequireAuth({ children, requireRole }: RequireAuthProps) {
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)

  if (loading && !user) {
    return <div className="grid min-h-[60vh] place-items-center text-primary"><Spinner size={32} /></div>
  }
  // Remember where the visitor was going so login can send them back.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (requireRole && user.profile?.role !== requireRole) return <Navigate to="/" replace />

  return <>{children}</>
}

export default RequireAuth
