import { apiFetch } from '../lib/api'
import type { CartItem, Order, OrderStatus } from '../types/database.types'

export const orderService = {
  async getAll(filters?: { status?: string }) {
    try {
      const suffix = filters?.status ? `?status=${encodeURIComponent(filters.status)}` : ''
      const response = await apiFetch<{ data: { orders: Order[] } }>(`/api/admin/orders${suffix}`)
      return response.data.orders
    } catch (error) {
      console.warn('Failed to fetch orders:', error)
      return []
    }
  },

  async getByCustomer(customerId: string) {
    try {
      const response = await apiFetch<{ data: Order[] }>(`/api/orders/customer/${customerId}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch customer orders:', error)
      return []
    }
  },

  async getVendorOrders(vendorId: string) {
    try {
      const response = await apiFetch<{ data: unknown[] }>(`/api/orders/vendor/${vendorId}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch vendor orders:', error)
      return []
    }
  },

  async create(customerId: string, cartItems: CartItem[], shippingInfo: Partial<Order>) {
    const response = await apiFetch<{ data: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ customerId, cartItems, shippingInfo }),
    })
    return response.data
  },

  async updateStatus(id: string, status: OrderStatus) {
    const response = await apiFetch<{ data: Order }>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return response.data
  },
}
