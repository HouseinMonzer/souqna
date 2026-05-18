import { supabase } from '../lib/supabase'
import type { Order, CartItem } from '../types/database.types'

export const orderService = {
  async getAll(filters?: { status?: string }) {
    try {
      let query = supabase.from('orders')
        .select('*, customers(user_id, profiles(full_name))')
        .order('created_at', { ascending: false })
      if (filters?.status) query = query.eq('status', filters.status as any)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    } catch (error) {
      console.warn('Failed to fetch orders:', error)
      return []
    }
  },
  async getByCustomer(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('orders').select('*, order_items(*, vendors(store_name, slug, logo_url))')
        .eq('customer_id', customerId).order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    } catch (error) {
      console.warn('Failed to fetch customer orders:', error)
      return []
    }
  },
  async getVendorOrders(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('order_items').select('*, orders(order_number, status, created_at, shipping_name)')
        .eq('vendor_id', vendorId).order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    } catch (error) {
      console.warn('Failed to fetch vendor orders:', error)
      return []
    }
  },
  async create(customerId: string, cartItems: CartItem[], shippingInfo: Partial<Order>) {
    try {
      const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
      const total = subtotal + (shippingInfo.shipping_cost ?? 0) + (shippingInfo.tax ?? 0)
      const { data: order, error } = await supabase
        .from('orders').insert({ customer_id: customerId, subtotal, total, ...shippingInfo })
        .select().single()
      if (error) throw error
      await supabase.from('order_items').insert(
        cartItems.map(i => ({
          order_id: order.id, product_id: i.product_id,
          vendor_id: i.product.vendor.id, variant_id: i.variant_id,
          quantity: i.quantity, unit_price: i.product.price,
          total_price: i.product.price * i.quantity,
          product_name: i.product.name, product_image: i.product.primary_image,
        }))
      )
      return order
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  },
  async updateStatus(id: string, status: Order['status']) {
    try {
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  },
}