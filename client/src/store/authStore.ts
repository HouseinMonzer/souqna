import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { authService } from '../api/auth'
import { vendorService } from '../api/vendors'
import type { AuthUser, UserRole } from '../types/database.types'

interface AuthState {
  user:     AuthUser | null
  loading:  boolean
  setUser:  (user: AuthUser | null) => void
  setAuth:  (user: AuthUser | null) => void
  signIn:   (email: string, password: string) => Promise<void>
  signUp:   (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>
  signOut:  () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, loading: true,
      setUser: (user) => set({ user }),
      setAuth: (user) => set({ user }),
      signIn: async (email, password) => {
        set({ loading: true })
        try { await authService.signIn(email, password); await get().loadUser() }
        finally { set({ loading: false }) }
      },
      signUp: async (email, password, fullName, role = 'customer') => {
        set({ loading: true })
        try { await authService.signUp(email, password, fullName, role); await get().loadUser() }
        finally { set({ loading: false }) }
      },
      signOut: async () => { await authService.signOut(); set({ user: null }) },
      loadUser: async () => {
        set({ loading: true })
        try {
          const session = await authService.getSession()
          if (!session) { set({ user: null }); return }
          const profile = await authService.getProfile(session.user.id)
          if (!profile) { set({ user: null }); return }
          const vendor = profile.role === 'vendor' ? await vendorService.getByUserId(session.user.id) : null
          const { data: customer } = profile.role === 'customer'
            ? await supabase.from('customers').select('*').eq('user_id', session.user.id).single()
            : { data: null }
          set({ user: { id: session.user.id, email: session.user.email!, profile, vendor, customer } })
        } finally { set({ loading: false }) }
      },
    }),
    { name: 'souqna-auth', partialize: (s) => ({ user: s.user }) }
  )
)