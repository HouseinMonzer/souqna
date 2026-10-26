import { useTranslation } from 'react-i18next'
import { Bell, Heart, LayoutDashboard, MapPin, Package, Shield, Store } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export function useAccountLinks() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const role = user?.profile?.role
  return [
    { to: '/account/orders', label: t('nav.orders'), icon: Package },
    { to: '/account/wishlist', label: t('nav.wishlist'), icon: Heart },
    { to: '/account/addresses', label: t('nav.addresses'), icon: MapPin },
    { to: '/account/notifications', label: t('nav.notifications'), icon: Bell },
    ...(role === 'vendor' ? [{ to: '/dashboard', label: t('nav.vendorDashboard'), icon: LayoutDashboard }] : []),
    ...(role === 'customer' ? [{ to: '/dashboard', label: t('nav.startSelling'), icon: Store }] : []),
    ...(role === 'admin' ? [{ to: '/admin', label: t('nav.admin'), icon: Shield }] : []),
  ]
}
