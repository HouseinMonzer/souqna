import { AUTH_TOKEN_KEY, apiFetch } from '../lib/api'
import type { AuthUser, Profile, ProfileUpdate, UserRole } from '../types/database.types'

interface AuthResponse {
  token: string
  user: AuthUser
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const response = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: fullName }),
    })
    localStorage.setItem(AUTH_TOKEN_KEY, response.token)
    return response.user
  },

  async signIn(email: string, password: string) {
    const response = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem(AUTH_TOKEN_KEY, response.token)
    return response.user
  },

  async signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    return null
  },

  async getSession() {
    try {
      const response = await apiFetch<{ user: AuthUser }>('/api/auth/me')
      return response.user
    } catch {
      return null
    }
  },

  async getProfile() {
    const session = await authService.getSession()
    return session?.profile ?? null
  },

  async updateProfile(userId: string, updates: ProfileUpdate) {
    void userId
    void updates
    throw new Error('Profile updates are not available yet.')
  },
}

export async function loginUser(email: string, password: string) {
  return authService.signIn(email, password)
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'customer',
  vendorDetails?: { location?: string; category?: string }
) {
  void role
  void vendorDetails
  return authService.signUp(email, password, fullName)
}

export async function logoutUser() {
  return authService.signOut()
}

export async function getCurrentSession() {
  return authService.getSession()
}

export async function getUserProfile(): Promise<Profile | null> {
  return authService.getProfile()
}

export async function updateUserProfile(userId: string, updates: ProfileUpdate) {
  return authService.updateProfile(userId, updates)
}
