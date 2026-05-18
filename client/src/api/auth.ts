import { supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types/database.types'

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: UserRole = 'customer') {
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
      if (data.user) {
        await supabase.from('profiles').update({ role, full_name: fullName }).eq('id', data.user.id)
        if (role === 'customer') await supabase.from('customers').insert({ user_id: data.user.id })
      }
      return data
    } catch (error) {
      console.error('Sign up failed:', error)
      throw error
    }
  },
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign in failed:', error)
      throw error
    }
  },
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  },
  async getSession() {
    try {
      const { data } = await supabase.auth.getSession()
      return data.session
    } catch (error) {
      console.warn('Failed to get session:', error)
      return null
    }
  },
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      return data
    } catch (error) {
      console.warn('Failed to get profile:', error)
      return null
    }
  },
  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  },
}
// Add these exports at the END of your existing src/api/auth.ts file

// -----------------------------------------------------------------------------
// Named exports used by pages like:
// import { loginUser, registerUser, logoutUser } from '../api/auth'
// -----------------------------------------------------------------------------

export async function loginUser(email: string, password: string) {
  return authService.signIn(email, password)
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'customer'
) {
  return authService.signUp(email, password, fullName, role)
}

export async function logoutUser() {
  return authService.signOut()
}

export async function getCurrentSession() {
  return authService.getSession()
}

export async function getUserProfile(userId: string) {
  return authService.getProfile(userId)
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
) {
  return authService.updateProfile(userId, updates)
}