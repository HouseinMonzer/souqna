import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const { user, loading, loadUser, signIn, signUp, signOut } = useAuthStore()
  useEffect(() => {
    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser())
    return () => subscription.unsubscribe()
  }, [])
  return {
    user, loading,
    isAdmin:    user?.profile.role === 'admin',
    isVendor:   user?.profile.role === 'vendor',
    isCustomer: user?.profile.role === 'customer',
    isLoggedIn: !!user,
    signIn, signUp, signOut,
  }
}