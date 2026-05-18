import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, ProductCard, ProductVariant } from '../types/database.types'

interface CartState {
  items:      CartItem[]
  addItem:    (product: ProductCard, quantity?: number, variant?: ProductVariant | null) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQty:  (productId: string, quantity: number, variantId?: string | null) => void
  clearCart:  () => void
  total:      () => number
  itemCount:  () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, variant = null) => set(state => {
        const vid = variant?.id ?? null
        const existing = state.items.find(i => i.product_id === product.id && i.variant_id === vid)
        if (existing) return { items: state.items.map(i => i.product_id === product.id && i.variant_id === vid ? { ...i, quantity: i.quantity + quantity } : i) }
        return { items: [...state.items, { product_id: product.id, variant_id: vid, quantity, product, variant: variant ?? null }] }
      }),
      removeItem: (productId, variantId = null) => set(state => ({
        items: state.items.filter(i => !(i.product_id === productId && i.variant_id === variantId))
      })),
      updateQty: (productId, quantity, variantId = null) => {
        if (quantity <= 0) { get().removeItem(productId, variantId); return }
        set(state => ({ items: state.items.map(i => i.product_id === productId && i.variant_id === variantId ? { ...i, quantity } : i) }))
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'souqna-cart' }
  )
)