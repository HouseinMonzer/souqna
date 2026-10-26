import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { Navbar, MobileTabBar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Spinner } from './components/ui'
import HomePage from './pages/HomePage'
import RequireAuth from './components/RequireAuth'
import { useAuthStore } from './store/authStore'
import { useWishlistStore } from './store/wishlistStore'

// Lazy-load every non-home route. Each becomes its own JS chunk fetched on demand.
const ShopPage = lazy(() => import('./pages/ShopPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const VendorsPage = lazy(() => import('./pages/VendorsPage'))
const VendorProfilePage = lazy(() => import('./pages/VendorProfilePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const VerifyPendingPage = lazy(() => import('./pages/VerifyPendingPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'))
const OrdersPage = lazy(() => import('./pages/account/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/account/OrderDetailPage'))
const WishlistPage = lazy(() => import('./pages/account/WishlistPage'))
const AddressesPage = lazy(() => import('./pages/account/AddressesPage'))
const NotificationsPage = lazy(() => import('./pages/account/NotificationsPage'))
// Development-only component showcase; compiled out of production builds.
const DesignSystemPage = import.meta.env.DEV ? lazy(() => import('./pages/DesignSystemPage')) : null

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      {/* Bottom padding keeps content clear of the mobile tab bar. */}
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Suspense fallback={<RouteSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  )
}

function AuthLayout({ children }: { children: ReactNode }) {
  return <main id="main" className="min-h-dvh">{children}</main>
}

function RouteSpinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-primary">
      <Spinner size={32} />
    </div>
  )
}

function App() {
  const loadUser = useAuthStore(s => s.loadUser)
  const userId = useAuthStore(s => s.user?.id)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Saved products follow the signed-in account.
  useEffect(() => {
    const wishlist = useWishlistStore.getState()
    if (userId) wishlist.load().catch(() => {})
    else wishlist.reset()
  }, [userId])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteSpinner />}>
        <Routes>
          {/* RequireAuth redirects unauthenticated users here. */}
          <Route path="/sign-in" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
          <Route path="/verify-pending" element={<AuthLayout><VerifyPendingPage /></AuthLayout>} />
          <Route path="/verify-email" element={<AuthLayout><VerifyEmailPage /></AuthLayout>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          {DesignSystemPage && <Route path="/design" element={<DesignSystemPage />} />}
          <Route path="/admin" element={<RequireAuth requireRole="admin"><AdminDashboard /></RequireAuth>} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendors/:slug" element={<VendorProfilePage />} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/subscribe" element={<SubscriptionPage />} />
            <Route path="/checkout/:vendorId" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
