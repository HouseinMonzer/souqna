import { apiFetch } from '../lib/api'
import type { Order, OrderStatus, Product } from '../types/database.types'
import { toQueryString } from './catalog'

export interface Address {
  id: string
  label: string | null
  full_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  region: string | null
  country: string
  postal_code: string | null
  is_default: boolean
}

export type AddressInput = {
  label?: string | null
  fullName: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  region?: string | null
  isDefault?: boolean
}

export interface StatusEntry {
  id: string
  order_item_id: string | null
  status: OrderStatus
  note: string | null
  created_at: string
}

export type OrderDetail = Order & { status_history?: StatusEntry[] }

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

const json = (method: string, body?: unknown) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })

export const addresses = {
  list: (signal?: AbortSignal) => apiFetch<{ data: Address[] }>('/api/addresses', { signal }).then(r => r.data),
  create: (input: AddressInput) => apiFetch<{ data: Address }>('/api/addresses', json('POST', input)).then(r => r.data),
  update: (id: string, input: Partial<AddressInput>) => apiFetch<{ data: Address }>(`/api/addresses/${id}`, json('PATCH', input)).then(r => r.data),
  remove: (id: string) => apiFetch(`/api/addresses/${id}`, json('DELETE')),
}

export const orders = {
  mine: (page = 1, signal?: AbortSignal) =>
    apiFetch<{ data: OrderDetail[]; total: number; page: number; limit: number }>(`/api/orders/my${toQueryString({ page })}`, { signal }),
  get: (id: string, signal?: AbortSignal) => apiFetch<{ data: OrderDetail }>(`/api/orders/${id}`, { signal }).then(r => r.data),
  place: (body: unknown, idempotencyKey: string) =>
    apiFetch<{ data: OrderDetail; replayed?: boolean }>('/api/orders', { ...json('POST', body), headers: { 'Idempotency-Key': idempotencyKey } }).then(r => r.data),
}

export const notifications = {
  list: (page = 1, signal?: AbortSignal) =>
    apiFetch<{ data: AppNotification[]; total: number; unread: number; page: number; limit: number }>(`/api/notifications${toQueryString({ page })}`, { signal }),
  read: (id: string) => apiFetch(`/api/notifications/${id}/read`, json('PATCH')),
  readAll: () => apiFetch('/api/notifications/read-all', json('POST')),
}

export const wishlist = {
  list: (signal?: AbortSignal) => apiFetch<{ data: (Product & { added_at: string })[] }>('/api/wishlist', { signal }).then(r => r.data),
}
