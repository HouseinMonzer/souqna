import { apiFetch } from '../lib/api'
import type { OrderItem, OrderStatus, Product, Vendor, VendorSubscription } from '../types/database.types'

export type VendorMe = Vendor & {
  listings_hidden?: boolean
  name: string
  category: string
  products: Product[]
}

export type VendorOrderItem = OrderItem & {
  orders: { order_number: string; status: OrderStatus; created_at: string; shipping_name: string | null } | null
}

export interface ProductInput {
  name: string
  description?: string | null
  price: number
  comparePrice?: number | null
  category?: string | null
  stock?: number
  imageUrl?: string | null
  status?: 'draft' | 'active' | 'inactive'
}

export interface StoreProfileInput {
  storeName?: string
  description?: string | null
  location?: string | null
  phone?: string | null
  website?: string | null
  whatsapp?: string | null
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
  youtube?: string | null
}

const json = (method: string, body?: unknown) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })

export const vendorApi = {
  me: (signal?: AbortSignal) => apiFetch<{ data: VendorMe }>('/api/vendor/me', { signal }).then(r => r.data),
  setup: (body: { storeName: string; description?: string; category?: string; location?: string; phone?: string }) =>
    apiFetch('/api/vendor/setup', json('POST', body)),
  subscription: (signal?: AbortSignal) =>
    apiFetch<{ data: VendorSubscription | null }>('/api/subscriptions/my', { signal }).then(r => r.data).catch(() => null),
  orders: (vendorId: string, signal?: AbortSignal) =>
    apiFetch<{ data: VendorOrderItem[]; total: number }>(`/api/orders/vendor/${vendorId}?limit=50`, { signal }),
  setItemStatus: (itemId: string, status: OrderStatus, trackingNumber?: string) =>
    apiFetch(`/api/vendor/orders/${itemId}/status`, json('PATCH', { status, ...(trackingNumber ? { trackingNumber } : {}) })),
  createProduct: (body: ProductInput) => apiFetch<{ data: Product }>('/api/vendor/products', json('POST', body)).then(r => r.data),
  updateProduct: (id: string, body: Partial<ProductInput>) => apiFetch<{ data: Product }>(`/api/vendor/products/${id}`, json('PUT', body)).then(r => r.data),
  deleteProduct: (id: string) => apiFetch(`/api/vendor/products/${id}`, json('DELETE')),
  uploadImage: (imageData: string, folder = 'products') =>
    apiFetch<{ url: string }>('/api/upload', json('POST', { imageData, folder })).then(r => r.url),
  updateProfile: (body: StoreProfileInput) => apiFetch('/api/vendor/profile', json('PATCH', body)),
  uploadCover: (imageData: string) => apiFetch('/api/vendor/cover', json('POST', { imageData })),
  uploadLogo: (imageData: string) => apiFetch('/api/vendor/logo', json('POST', { imageData })),
}
