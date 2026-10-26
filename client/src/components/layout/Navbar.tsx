import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Heart, Languages, LogOut, Menu, Monitor, Moon, Search, ShoppingBag, Store, Sun, User,
} from 'lucide-react'
import {
  Avatar, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, IconButton, Sheet, SheetContent,
} from '../ui'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore, type ThemePreference } from '../../store/themeStore'
import { useAccountLinks } from '../../hooks/useAccountLinks'
import { toggleLanguage } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { Container } from './Container'
import { Logo } from './Logo'
import { SearchBox } from './SearchBox'

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor }

function ThemeMenu() {
  const { t } = useTranslation()
  const { preference, setPreference } = useThemeStore()
  const Icon = THEME_ICONS[preference]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label={t('nav.theme')} icon={<Icon />} size="icon-sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-40">
        {(['light', 'dark', 'system'] as ThemePreference[]).map(option => {
          const OptionIcon = THEME_ICONS[option]
          return (
            <DropdownMenuItem key={option} icon={<OptionIcon />} onSelect={() => setPreference(option)} className={cn(preference === option && 'font-semibold text-primary')}>
              {t(`nav.theme${option[0].toUpperCase()}${option.slice(1)}`)}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AccountMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)!
  const logout = useAuthStore(s => s.logout)
  const links = useAccountLinks()
  const name = user.profile?.full_name || user.email
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t('nav.myAccount')} className="rounded-full">
          <Avatar name={name} src={user.profile?.avatar_url} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate text-sm font-semibold text-fg">{name}</span>
          <span className="truncate font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map(({ to, label, icon: Icon }) => (
          <DropdownMenuItem key={to} icon={<Icon />} onSelect={() => navigate(to)}>{label}</DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<LogOut />} destructive onSelect={() => { logout(); navigate('/') }}>{t('nav.logout')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CartButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const count = useCartStore(s => s.itemCount())
  const [bump, setBump] = useState(false)
  useEffect(() => {
    if (!count) return
    setBump(true)
    const timer = setTimeout(() => setBump(false), 400)
    return () => clearTimeout(timer)
  }, [count])
  return (
    <Button asChild variant="ghost" size="icon-sm" className={cn('relative', className)}>
      <Link to="/cart" aria-label={t('nav.cartCount', { count })}>
        <ShoppingBag />
        {count > 0 && (
          <span
            aria-hidden
            className={cn(
              'absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold tabular-nums text-accent-fg ring-2 ring-surface transition-transform duration-(--duration-base) ease-(--ease-emphasized)',
              bump && 'scale-125',
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  )
}

function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const links = useAccountLinks()
  const { preference, setPreference } = useThemeStore()
  const close = () => onOpenChange(false)
  const rowClass = 'flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-fg hover:bg-surface-muted [&_svg]:size-5 [&_svg]:text-fg-subtle'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="start" title={<Logo onClick={close} />}>
        <div className="grid gap-6 pb-6">
          <SearchBox onNavigate={close} />
          <nav className="grid gap-0.5">
            <Link to="/shop" onClick={close} className={rowClass}><ShoppingBag />{t('nav.shop')}</Link>
            <Link to="/vendors" onClick={close} className={rowClass}><Store />{t('nav.vendors')}</Link>
          </nav>
          {user ? (
            <nav className="grid gap-0.5 border-t border-border pt-4">
              {links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={close} className={rowClass}><Icon />{label}</Link>
              ))}
              <button type="button" onClick={() => { logout(); close(); navigate('/') }} className={cn(rowClass, 'text-danger [&_svg]:text-danger')}>
                <LogOut />{t('nav.logout')}
              </button>
            </nav>
          ) : (
            <div className="grid gap-2 border-t border-border pt-4">
              <Button asChild fullWidth><Link to="/register" onClick={close}>{t('nav.register')}</Link></Button>
              <Button asChild fullWidth variant="outline"><Link to="/login" onClick={close}>{t('nav.signIn')}</Link></Button>
            </div>
          )}
          <div className="grid gap-3 border-t border-border pt-4">
            <button type="button" onClick={toggleLanguage} className={rowClass}><Languages />{t('nav.language')}</button>
            <div className="grid gap-2 px-3">
              <span className="text-sm font-medium text-fg-muted">{t('nav.theme')}</span>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-muted p-1">
                {(['light', 'dark', 'system'] as ThemePreference[]).map(option => {
                  const Icon = THEME_ICONS[option]
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={preference === option}
                      onClick={() => setPreference(option)}
                      className={cn('flex items-center justify-center gap-1.5 rounded-md py-2 text-sm text-fg-muted', preference === option && 'bg-surface text-fg shadow-sm')}
                    >
                      <Icon className="size-4" />
                      {t(`nav.theme${option[0].toUpperCase()}${option.slice(1)}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn('rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'text-fg' : 'text-fg-muted hover:text-fg')

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">
        {t('nav.skipToContent')}
      </a>
      <Container className="flex h-16 items-center gap-3 lg:gap-6">
        <IconButton label={t('nav.openMenu')} icon={<Menu />} size="icon-sm" className="-ms-2 lg:hidden" onClick={() => setMenuOpen(true)} />
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/shop" className={navLink}>{t('nav.shop')}</NavLink>
          <NavLink to="/vendors" className={navLink}>{t('nav.vendors')}</NavLink>
        </nav>
        <SearchBox className="hidden max-w-xl flex-1 md:block" />
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <IconButton label={t('nav.search')} icon={<Search />} size="icon-sm" className="md:hidden" onClick={() => setSearchOpen(open => !open)} aria-expanded={searchOpen} />
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex" startIcon={<Languages />} onClick={toggleLanguage}>
            {t('nav.language')}
          </Button>
          <div className="hidden lg:block"><ThemeMenu /></div>
          <CartButton className="hidden md:inline-flex" />
          {user ? (
            <div className="ms-1 hidden md:block"><AccountMenu /></div>
          ) : (
            <div className="ms-1 hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm"><Link to="/login">{t('nav.signIn')}</Link></Button>
              <Button asChild size="sm"><Link to="/register">{t('nav.register')}</Link></Button>
            </div>
          )}
        </div>
      </Container>
      {searchOpen && (
        <Container className="pb-3 md:hidden">
          <SearchBox autoFocus />
        </Container>
      )}
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  )
}

/** Bottom navigation for phones; hidden from the md breakpoint up. */
export function MobileTabBar() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const count = useCartStore(s => s.itemCount())
  const tabs = [
    { to: '/', label: t('nav.home'), icon: Store, end: true },
    { to: '/shop', label: t('nav.shop'), icon: Search },
    { to: '/account/wishlist', label: t('nav.wishlist'), icon: Heart },
    { to: '/cart', label: t('nav.cart'), icon: ShoppingBag, badge: count },
    { to: user ? '/account/orders' : '/login', label: t('nav.account'), icon: User },
  ]
  return (
    <nav
      aria-label={t('nav.menu')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, end, badge }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-primary' : 'text-fg-subtle')}
            >
              <span className="relative">
                <Icon aria-hidden className="size-[22px]" strokeWidth={1.75} />
                {!!badge && (
                  <span className="absolute -end-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold tabular-nums text-accent-fg">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
