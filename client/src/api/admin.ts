import { apiFetch } from '../lib/api'

export interface Analytics {
  totalVendors: number
  pendingVendors: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  ordersLast7Days: { day: string; count: number }[]
  revenueByMonth: { month: number; year: number; revenue: number }[]
  topVendors: { id: string; storeName: string; orderCount: number; productCount: number; revenue: number }[]
}

export interface Vendor {
  id: string
  storeName: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  logoUrl: string | null
  ownerName: string | null
  user: { email: string }
  _count: { products: number; orders: number }
  revenue: number
  joinedAt: string | null
}

export interface Product {
  id: string
  name: string
  price: number
  stock: number
  totalSold: number
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'DELETED' | 'SUSPENDED'
  image: string | null
  vendor: { storeName: string }
}

export interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  paymentStatus: string
  channel: 'WEB'
  createdAt: string
  user: { name: string }
  vendor: { storeName: string }
}

export interface AuditLog {
  id: string
  actorId: string
  action: string
  targetType: string
  targetId: string
  targetName: string
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

export interface AdminUser {
  id: string
  email: string
  fullName: string | null
  role: 'admin' | 'vendor' | 'customer'
  storeName: string | null
  createdAt: string
}

export interface AdminSubscription {
  id: string
  vendor_id: string
  plan: 'monthly' | 'annual'
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled'
  payment_method: string | null
  amount: number
  start_date: string | null
  end_date: string | null
  payment_proof: string | null
  admin_note: string | null
  created_at: string
  vendor: { store_name: string; slug: string; logo_url: string | null } | null
}

export interface SiteSettings {
  id: string
  siteName: string
  currency: string
  commissionRate: number
  autoApproveVendors: boolean
  maintenanceMode: boolean
}

interface PaginatedParams {
  page?: number
  limit?: number
}

export const adminApi = {
  async getAnalytics() {
    const response = await apiFetch<{ data: Analytics }>('/api/admin/analytics')
    return response.data
  },

  async getVendors(params: { search?: string; status?: string } & PaginatedParams = {}) {
    const search = new URLSearchParams()
    if (params.search) search.set('search', params.search)
    if (params.status) search.set('status', params.status)
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    const suffix = search.toString() ? `?${search}` : ''
    const response = await apiFetch<{ data: { vendors: Vendor[]; total: number; page: number; limit: number } }>(`/api/admin/vendors${suffix}`)
    return response.data
  },

  async updateVendorStatus(id: string, status: Vendor['status'] | string, reason?: string) {
    const response = await apiFetch<{ data: unknown }>(`/api/admin/vendors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toLowerCase(), reason: reason || undefined }),
    })
    return response.data
  },

  async getProducts(params: { status?: string; search?: string } & PaginatedParams = {}) {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.search) search.set('search', params.search)
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    const suffix = search.toString() ? `?${search}` : ''
    const response = await apiFetch<{ data: { products: Product[]; total: number; page: number; limit: number } }>(`/api/admin/products${suffix}`)
    return response.data
  },

  async updateProductStatus(id: string, status: 'suspended' | 'unsuspended' | string) {
    const response = await apiFetch<{ data: unknown }>(`/api/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toLowerCase() }),
    })
    return response.data
  },

  async getOrders(params: { status?: string; search?: string } & PaginatedParams = {}) {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.search) search.set('search', params.search)
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    const suffix = search.toString() ? `?${search}` : ''
    const response = await apiFetch<{ data: { orders: Order[]; total: number; page: number; limit: number } }>(`/api/admin/orders${suffix}`)
    return response.data
  },

  async updateOrderStatus(id: string, status: string) {
    const response = await apiFetch<{ data: unknown }>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toLowerCase() }),
    })
    return response.data
  },

  async getAuditLogs(params: { action?: string; targetType?: string } & PaginatedParams = {}) {
    const search = new URLSearchParams()
    if (params.action) search.set('action', params.action)
    if (params.targetType) search.set('targetType', params.targetType)
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    const suffix = search.toString() ? `?${search}` : ''
    const response = await apiFetch<{ data: { logs: AuditLog[]; total: number } }>(`/api/admin/audit-logs${suffix}`)
    return response.data
  },

  async getUsers(params: { search?: string; role?: string } & PaginatedParams = {}) {
    const search = new URLSearchParams()
    if (params.search) search.set('search', params.search)
    if (params.role) search.set('role', params.role)
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    const suffix = search.toString() ? `?${search}` : ''
    const response = await apiFetch<{ data: { users: AdminUser[]; total: number; page: number; limit: number } }>(`/api/admin/users${suffix}`)
    return response.data
  },

  async updateUserRole(userId: string, role: 'admin' | 'vendor' | 'customer') {
    const response = await apiFetch<{ data: unknown }>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    return response.data
  },

  async getSubscriptions(params: { status?: string } = {}) {
    const suffix = params.status ? `?status=${encodeURIComponent(params.status)}` : ''
    const response = await apiFetch<{ data: AdminSubscription[] }>(`/api/admin/subscriptions${suffix}`)
    return response.data
  },

  async updateSubscriptionStatus(id: string, status: string, adminNote?: string) {
    const response = await apiFetch<{ data: AdminSubscription }>(`/api/admin/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    })
    return response.data
  },

  async getSettings() {
    const response = await apiFetch<{ data: SiteSettings }>('/api/admin/settings')
    return response.data
  },

  async updateSettings(data: Partial<Omit<SiteSettings, 'id'>>) {
    const response = await apiFetch<{ data: SiteSettings }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return response.data
  },
}
