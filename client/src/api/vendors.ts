// src/api/vendors.ts

import { supabase } from '../lib/supabase'
import type { Vendor, VendorInsert, VendorUpdate } from '../types/database.types'

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export interface VendorType {
  id: string
  name: string
  initials: string
  category: string
  description: string
  rating: number
  sales: number
  products: number
  location: string
  joined: string
  color: string
}

/* -------------------------------------------------------------------------- */
/*                            Utility Functions                               */
/* -------------------------------------------------------------------------- */

const vendorColors = [
  '#5C8A2E',
  '#2D4A1E',
  '#A3C46C',
  '#6D9F3B',
  '#8AA65A',
  '#4F7A22',
]

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

/* -------------------------------------------------------------------------- */
/*                              Main Service                                  */
/* -------------------------------------------------------------------------- */

export const vendorService = {
  async getAll(status?: string) {
    try {
      let query = supabase
        .from('vendors')
        .select('*, profiles(full_name, avatar_url)')

      if (status) {
        query = query.eq('status', status as any)
      }

      const { data, error } = await query.order('joined_at', {
        ascending: false,
      })

      if (error) throw error
      return data ?? []
    } catch (error) {
      console.warn('Failed to fetch vendors:', error)
      return []
    }
  },

  async getBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, vendor_social_links(*)')
        .eq('slug', slug)
        .eq('status', 'active')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to fetch vendor:', error)
      return null
    }
  },

  async getByUserId(userId: string): Promise<Vendor | null> {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', userId)
        .single()

      return data
    } catch (error) {
      console.warn('Failed to fetch vendor by user:', error)
      return null
    }
  },

  async create(vendor: VendorInsert) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([vendor])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create vendor:', error)
      throw error
    }
  },

  async update(id: string, updates: VendorUpdate) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update vendor:', error)
      throw error
    }
  },

  async updateStatus(id: string, status: Vendor['status']) {
    return vendorService.update(id, { status })
  },

  async getSummary(vendorId: string): Promise<VendorSummary | null> {
    try {
      const { data } = await supabase
        .from('vendor_summary')
        .select('*')
        .eq('vendor_id', vendorId)
        .single()

      return data
    } catch (error) {
      console.warn('Failed to fetch vendor summary:', error)
      return null
    }
  },
}

/* -------------------------------------------------------------------------- */
/*                        Exported Function for UI                            */
/* -------------------------------------------------------------------------- */

// This is the function your VendorsPage.tsx is importing:
// import { fetchVendors, type VendorType } from '../api/vendors'

export async function fetchVendors(): Promise<VendorType[]> {
  const data = await vendorService.getAll('active')

  if (!data) return []

  return data.map((vendor: any, index: number) => ({
    id: vendor.id,
    name:
      vendor.business_name ||
      vendor.store_name ||
      vendor.profiles?.full_name ||
      'Unnamed Vendor',

    initials: getInitials(
      vendor.business_name ||
        vendor.store_name ||
        vendor.profiles?.full_name ||
        'Vendor'
    ),

    category: vendor.category || 'General',
    description: vendor.description || '',
    rating: Number(vendor.rating || 0),
    sales: Number(vendor.total_sales || 0),
    products: Number(vendor.products_count || 0),
    location: vendor.location || 'Lebanon',

    joined: vendor.joined_at
      ? new Date(vendor.joined_at).getFullYear().toString()
      : '2024',

    color: getColor(index),
  }))
}