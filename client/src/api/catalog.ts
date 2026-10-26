import { apiFetch } from '../lib/api'
import type { Category, Product, Vendor } from '../types/database.types'

export interface ProductPage {
  data: Product[]
  total: number
  page: number
  limit: number
}

export type ProductSort = 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'rating'

export interface ProductQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  vendor?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sort?: ProductSort
}

export function toQueryString(params: object) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const catalog = {
  categories: (signal?: AbortSignal) =>
    apiFetch<{ data: Category[] }>('/api/categories', { signal }).then(r => r.data),

  products: (query: ProductQuery, signal?: AbortSignal) =>
    apiFetch<ProductPage>(`/api/products${toQueryString(query)}`, { signal }),

  product: async (slug: string, signal?: AbortSignal) => {
    try {
      return (await apiFetch<{ data: Product | null }>(`/api/products/${encodeURIComponent(slug)}`, { signal })).data
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) return null
      throw error
    }
  },

  related: (categoryId: string, excludeId: string, signal?: AbortSignal) =>
    apiFetch<{ data: Product[] }>(`/api/products/related${toQueryString({ categoryId, excludeId, limit: 4 })}`, { signal }).then(r => r.data),

  vendors: (query: { page?: number; limit?: number; search?: string } = {}, signal?: AbortSignal) =>
    apiFetch<{ data: Vendor[]; total: number; page: number; limit: number }>(`/api/vendors${toQueryString(query)}`, { signal }),
}

export interface Review {
  id: string
  product_id: string
  rating: number
  title: string | null
  body: string | null
  author_name: string
  verified_purchase: boolean
  created_at: string
}

export interface ReviewPage {
  data: Review[]
  total: number
  page: number
  limit: number
  summary: { average: number; count: number; breakdown: Record<'1' | '2' | '3' | '4' | '5', number> }
}

export const reviews = {
  list: (productId: string, page = 1, signal?: AbortSignal) =>
    apiFetch<ReviewPage>(`/api/products/${productId}/reviews?page=${page}`, { signal }),
  submit: (productId: string, body: { rating: number; title?: string; body?: string }) =>
    apiFetch<{ data: Review }>(`/api/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.data),
}
