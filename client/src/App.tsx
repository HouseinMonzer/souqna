import React, { lazy, Suspense } from 'react'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/home/Footer'
import HomePage from './pages/HomePage'
import { ToastProvider } from './components/ui'
import RequireAuth from './components/RequireAuth'
import { useAuthStore } from './store/authStore'

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

function MainLayout() {
  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      <Footer />
      <ToastProvider />
    </div>
  )
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  )
}

function RouteSpinner() {
  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #5C8A2E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function App() {
  const loadUser = useAuthStore(s => s.loadUser)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteSpinner />}>
        <Routes>
          {/* RequireAuth redirects unauthenticated users here; /login hosts the real Clerk <SignIn/>. */}
          <Route path="/sign-in" element={<Navigate to="/login" replace />} />
          <Route path="/login/*" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register/*" element={<AuthLayout><RegisterPage /></AuthLayout>} />
          <Route path="/verify-pending" element={<AuthLayout><VerifyPendingPage /></AuthLayout>} />
          <Route path="/verify-email" element={<AuthLayout><VerifyEmailPage /></AuthLayout>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
            <Route path="/checkout/:vendorId" element={<CheckoutPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
