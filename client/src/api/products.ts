import { apiFetch } from '../lib/api'
import type { Product, ProductInsert, ProductUpdate } from '../types/database.types'

type ProductListResponse = { data: Product[]; total: number }
type ProductResponse = { data: Product | null }

function toQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const productService = {
  async getAll(page = 1, limit = 12, filters: Record<string, unknown> = {}) {
    try {
      return await apiFetch<ProductListResponse>(`/api/products${toQuery({ page, limit, ...filters })}`)
    } catch (error) {
      console.warn('Failed to fetch products:', error)
      return { data: [], total: 0 }
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await apiFetch<ProductResponse>(`/api/products/${slug}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch product:', error)
      return null
    }
  },

  async getRelated(categoryId: string, excludeId: string, limit = 3) {
    try {
      const response = await apiFetch<{ data: Product[] }>(`/api/products/related${toQuery({ categoryId, excludeId, limit })}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch related products:', error)
      return []
    }
  },

  async getByVendor(vendorId: string) {
    try {
      const response = await apiFetch<{ data: Product[] }>(`/api/products/vendor/${vendorId}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch vendor products:', error)
      return []
    }
  },

  async getPendingApproval() {
    try {
      const response = await apiFetch<{ data: Product[] }>('/api/admin/products?status=pending')
      return response.data
    } catch (error) {
      console.warn('Failed to fetch pending products:', error)
      return []
    }
  },

  async create(product: ProductInsert) {
    const response = await apiFetch<ProductResponse>('/api/vendor/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
    return response.data
  },

  async update(id: string, updates: ProductUpdate) {
    const response = await apiFetch<ProductResponse>(`/api/vendor/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    return response.data
  },

  async approve(id: string) {
    return productService.update(id, { status: 'active', approvalStatus: 'approved' })
  },

  async reject(id: string) {
    return productService.update(id, { approvalStatus: 'rejected' })
  },

  async delete(id: string) {
    await apiFetch(`/api/vendor/products/${id}`, { method: 'DELETE' })
  },
}
