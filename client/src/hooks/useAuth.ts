import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, loading, signOut, signIn, signUp } = useAuthStore()

  return {
    user,
    loading,
    isAdmin: user?.profile.role === 'admin',
    isVendor: user?.profile.role === 'vendor',
    isCustomer: user?.profile.role === 'customer',
    isLoggedIn: !!user,
    signIn,
    signUp,
    signOut,
  }
}
