import React from 'react'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/home/Footer'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import VendorsPage from './pages/VendorsPage'
import VendorProfilePage from './pages/VendorProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminDashboard from './pages/AdminDashboard'
import SubscriptionPage from './pages/SubscriptionPage'
import CheckoutPage from './pages/CheckoutPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import { ToastProvider } from './components/ui'
import RequireAuth from './components/RequireAuth'
import { useAuthStore } from './store/authStore'

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

function App() {
  const loadUser = useAuthStore(s => s.loadUser)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<AuthLayout><LoginPage /></AuthLayout>} />
        <Route path="/login/*" element={<AuthLayout><LoginPage /></AuthLayout>} />
        <Route path="/register/*" element={<AuthLayout><RegisterPage /></AuthLayout>} />
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
    </BrowserRouter>
  )
}

export default App
