import { supabase, isConfigured } from '../lib/supabase'
import type { ProductInsert, ProductUpdate } from '../types/database.types'

export const productService = {
  async getAll(page = 1, limit = 12, filters?: any) {
    try {
      let query = supabase
        .from('products')
        .select('*, product_images(image_url, is_primary), vendors(id, store_name, slug), categories(id, name, slug)', { count: 'exact' })
        .eq('status', 'active').eq('approval_status', 'approved')
      if (filters?.category) query = query.eq('category_id', filters.category)
      if (filters?.minPrice) query = query.gte('price', filters.minPrice)
      if (filters?.maxPrice) query = query.lte('price', filters.maxPrice)
      if (filters?.featured) query = query.eq('featured', true)
      if (filters?.search)   query = query.ilike('name', `%${filters.search}%`)
      const from = (page - 1) * limit
      const { data, error, count } = await query.range(from, from + limit - 1)
      if (error) throw error
      return { data: data ?? [], total: count ?? 0 }
    } catch (error) {
      console.warn('Failed to fetch products:', error)
      return { data: [], total: 0 }
    }
  },
  async getBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), product_variants(*), vendors(id, store_name, slug, logo_url, rating, verified), categories(id, name, slug)')
        .eq('slug', slug).single()
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to fetch product:', error)
      return null
    }
  },
  async getByVendor(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('products').select('*, product_images(image_url, is_primary)')
        .eq('vendor_id', vendorId).order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    } catch (error) {
      console.warn('Failed to fetch vendor products:', error)
      return []
    }
  },
  async getPendingApproval() {
    try {
      const { data, error } = await supabase
        .from('products').select('*, vendors(store_name), categories(name)')
        .eq('approval_status', 'pending').order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    } catch (error) {
      console.warn('Failed to fetch pending products:', error)
      return []
    }
  },
  async create(product: ProductInsert) {
    try {
      const { data, error } = await supabase.from('products').insert(product).select().single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create product:', error)
      throw error
    }
  },
  async update(id: string, updates: ProductUpdate) {
    try {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update product:', error)
      throw error
    }
  },
  async approve(id: string) { return productService.update(id, { approval_status: 'approved', status: 'active' }) },
  async reject(id: string)  { return productService.update(id, { approval_status: 'rejected' }) },
  async delete(id: string) {
    try {
      const { error } = await supabase.from('products').update({ status: 'deleted' }).eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Failed to delete product:', error)
      throw error
    }
  },
}