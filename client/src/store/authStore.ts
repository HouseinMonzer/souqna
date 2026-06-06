import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AUTH_TOKEN_KEY, apiFetch } from '../lib/api'
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
    (set) => ({
      user: null,
      loading: false,
      setUser: (user) => set({ user }),
      loadUser: async () => {
        if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
          set({ user: null, loading: false })
          return
        }
        set({ loading: true })
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const response = await apiFetch<{ user: AuthUser }>('/api/auth/me')
            set({ user: response.user ?? null, loading: false })
            return
          } catch {
            if (attempt < 3) await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
          }
        }
        localStorage.removeItem(AUTH_TOKEN_KEY)
        set({ user: null, loading: false })
      },
      logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        set({ user: null, loading: false })
      },
      signOut: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        set({ user: null, loading: false })
      },
      signIn: async (email, password) => {
        set({ loading: true })
        try {
          const response = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          })
          localStorage.setItem(AUTH_TOKEN_KEY, response.token)
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
          // Register now returns { message, email, needsVerification } — no token yet
          await apiFetch<{ message: string; email: string; needsVerification: boolean }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
          })
          set({ loading: false })
          // Return a sentinel so the caller knows to redirect to verify-pending
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
