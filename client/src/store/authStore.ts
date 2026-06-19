import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from '../lib/api'
import type { AuthUser } from '../types/database.types'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  loadUser: () => Promise<void>
  logout: () => void
  signOut: () => void
  signIn: (email: string, password: string) => Promise<AuthUser>
  signUp: (email: string, password: string, name: string) => Promise<AuthUser>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      setUser: (user) => set({ user }),
      loadUser: async () => {
        // Skip if no persisted user and not coming from a fresh sign-in
        // We still verify on every load when user appears to be logged in
        set({ loading: true })
        try {
          const response = await apiFetch<{ user: AuthUser }>('/api/auth/me')
          set({ user: response.user ?? null, loading: false })
        } catch {
          // 401 means the cookie is gone — clear local state
          if (get().user !== null) set({ user: null, loading: false })
          else set({ loading: false })
        }
      },
      logout: () => {
        set({ user: null, loading: false })
        apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      },
      signOut: () => {
        set({ user: null, loading: false })
        apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      },
      signIn: async (email, password) => {
        set({ loading: true })
        try {
          const response = await apiFetch<{ user: AuthUser }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          })
          set({ user: response.user, loading: false })
          return response.user
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },
      signUp: async (email, password, name) => {
        set({ loading: true })
        try {
          await apiFetch<{ message: string; email: string; needsVerification: boolean }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
          })
          set({ loading: false })
          return { needsVerification: true, email } as unknown as AuthUser
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },
    }),
    { name: 'souqna-auth', partialize: (state) => ({ user: state.user }) }
  )
)
