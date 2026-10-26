import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Heart, MapPin, Package } from 'lucide-react'
import { Container } from '../../components/layout/Container'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

export default function AccountLayout() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const links = [
    { to: '/account/orders', label: t('account.orders'), icon: Package },
    { to: '/account/wishlist', label: t('account.wishlist'), icon: Heart },
    { to: '/account/addresses', label: t('account.addresses'), icon: MapPin },
    { to: '/account/notifications', label: t('account.notifications'), icon: Bell },
  ]
  return (
    <Container className="grid gap-6 py-6 sm:py-8 lg:grid-cols-[14rem_1fr] lg:gap-10">
      <aside className="grid content-start gap-4">
        <div className="hidden lg:grid lg:gap-0.5">
          <p className="font-display text-xl font-semibold">{t('account.title')}</p>
          <p className="truncate text-sm text-fg-muted">{user?.email}</p>
        </div>
        <nav aria-label={t('account.title')} className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:px-0">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'inline-flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0"><Outlet /></div>
    </Container>
  )
}
