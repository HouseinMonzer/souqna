import { apiFetch } from '../lib/api'
import type { Vendor, VendorSummary, VendorUpdate } from '../types/database.types'

// Shape consumed by VendorsPage VendorCard. logoUrl/coverUrl added in commit
// 24afb84 — if a deployed bundle is missing these, force a rebuild.
export interface VendorType {
  id: string
  slug: string
  name: string
  initials: string
  logoUrl?: string | null
  coverUrl?: string | null
  category: string
  description: string
  rating: number
  sales: number
  products: number
  location: string
  joined: string
  color: string
}

const vendorColors = ['#5C8A2E', '#2D4A1E', '#A3C46C', '#6D9F3B', '#8AA65A', '#4F7A22']

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getColor(index: number): string {
  return vendorColors[index % vendorColors.length]
}

export const vendorService = {
  async getAll(status = 'active') {
    try {
      const response = await apiFetch<{ data: Vendor[] }>(`/api/vendors?status=${encodeURIComponent(status)}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch vendors:', error)
      return []
    }
  },

  async getById(id: string) {
    try {
      const response = await apiFetch<{ data: Vendor | null }>(`/api/vendors/${id}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch vendor:', error)
      return null
    }
  },

  async getBySlug(slug: string) {
    try {
      const response = await apiFetch<{ data: Vendor | null }>(`/api/vendors/slug/${slug}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch vendor:', error)
      return null
    }
  },

  async getByUserId(userId: string) {
    try {
      const response = await apiFetch<{ data: Vendor | null }>(`/api/vendors/user/${userId}`)
      return response.data
    } catch (error) {
      console.warn('Failed to fetch vendor by user:', error)
      return null
    }
  },

  async update(id: string, updates: VendorUpdate) {
    const response = await apiFetch<{ data: Vendor }>(`/api/admin/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    return response.data
  },

  async updateStatus(id: string, status: Vendor['status']) {
    const response = await apiFetch<{ data: Vendor }>(`/api/admin/vendors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return response.data
  },

  async getSummary(vendorId: string): Promise<VendorSummary | null> {
    const vendors = await vendorService.getAll('')
    const vendor = vendors.find(item => item.id === vendorId)
    if (!vendor) return null
    return {
      vendor_id: vendor.id,
      store_name: vendor.store_name,
      status: vendor.status,
      rating: vendor.rating,
      total_reviews: vendor.total_reviews,
      total_sales: vendor.total_sales,
      total_orders: 0,
      active_products: vendor.products_count,
    }
  },
}

export async function fetchVendors(): Promise<VendorType[]> {
  const data = await vendorService.getAll('active')
  return data.map((vendor, index) => ({
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.business_name || vendor.store_name || 'Unnamed Vendor',
    initials: getInitials(vendor.business_name || vendor.store_name || 'Vendor'),
    logoUrl: vendor.logo_url ?? null,
    coverUrl: vendor.cover_url ?? null,
    category: vendor.mission || 'General',
    description: vendor.description || '',
    rating: Number(vendor.rating || 0),
    sales: Number(vendor.total_sales || 0),
    products: Number(vendor.products_count || 0),
    location: vendor.location || 'Lebanon',
    joined: vendor.joined_at ? new Date(vendor.joined_at).getFullYear().toString() : '2024',
    color: getColor(index),
  }))
}
