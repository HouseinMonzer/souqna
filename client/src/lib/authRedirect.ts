import type { AuthUser } from '../types/database.types'

/** Where to send someone after they sign in: back to where they were, or their role's home. */
export function postLoginPath(user: AuthUser, from?: unknown): string {
  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login')) return from
  if (user.profile?.role === 'admin') return '/admin'
  if (user.profile?.role === 'vendor') return '/dashboard'
  return '/'
}
