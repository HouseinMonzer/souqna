export const BRAND = {
  PRIMARY: '#5C8A2E',
  DARK:    '#2D4A1E',
  LIGHT:   '#A3C46C',
  CREAM:   '#F7F2E8',
  TEXT:    '#1A2E0E',
} as const

export const ROUTES = {
  HOME:             '/',
  SHOP:             '/shop',
  PRODUCT:          '/product/:slug',
  VENDOR_STORE:     '/store/:slug',
  CART:             '/cart',
  CHECKOUT:         '/checkout',
  LOGIN:            '/sign-in',
  REGISTER:         '/register',
  ORDERS:           '/account/orders',
  WISHLIST:         '/account/wishlist',
  PROFILE:          '/account/profile',
  VENDOR_DASH:      '/vendor/dashboard',
  VENDOR_PRODUCTS:  '/vendor/products',
  VENDOR_ORDERS:    '/vendor/orders',
  VENDOR_ANALYTICS: '/vendor/analytics',
  VENDOR_SETTINGS:  '/vendor/settings',
  ADMIN_DASH:       '/admin/dashboard',
  ADMIN_VENDORS:    '/admin/vendors',
  ADMIN_PRODUCTS:   '/admin/products',
  ADMIN_ORDERS:     '/admin/orders',
  ADMIN_CUSTOMERS:  '/admin/customers',
  ADMIN_FINANCE:    '/admin/finance',
  ADMIN_SETTINGS:   '/admin/settings',
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  refunded:   'bg-gray-100 text-gray-800',
}

export const VENDOR_STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  active:    'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  rejected:  'bg-gray-100 text-gray-800',
}
