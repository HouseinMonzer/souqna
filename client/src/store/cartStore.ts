import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, VendorCart, ProductCard, ProductVariant } from '../types/database.types'

interface CartState {
  vendorCarts: VendorCart[]
  addItem: (product: ProductCard, quantity?: number, variant?: ProductVariant | null) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQty: (productId: string, quantity: number, variantId?: string | null) => void
  clearCart: () => void
  clearVendorCart: (vendorId: string) => void
  total: () => number
  vendorTotal: (vendorId: string) => number
  itemCount: () => number
  getVendorCart: (vendorId: string) => VendorCart | undefined
  getAllItems: () => CartItem[]
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      vendorCarts: [],

      addItem: (product, quantity = 1, variant = null) => set(state => {
        const vendorId = product.vendor.id
        const vendorName = product.vendor.store_name
        const vendorSlug = product.vendor.slug
        const vendorLogo = (product.vendor as { logo_url?: string | null }).logo_url ?? null
        const vid = variant?.id ?? null

        const existingCartIdx = state.vendorCarts.findIndex(vc => vc.vendorId === vendorId)

        if (existingCartIdx === -1) {
          return {
            vendorCarts: [...state.vendorCarts, {
              vendorId, vendorName, vendorSlug, vendorLogo,
              items: [{ product_id: product.id, variant_id: vid, quantity, product, variant: variant ?? null }],
            }],
          }
        }

        const cart = state.vendorCarts[existingCartIdx]
        const existingItemIdx = cart.items.findIndex(i => i.product_id === product.id && i.variant_id === vid)

        const updatedItems = existingItemIdx === -1
          ? [...cart.items, { product_id: product.id, variant_id: vid, quantity, product, variant: variant ?? null }]
          : cart.items.map((i, idx) => idx === existingItemIdx ? { ...i, quantity: i.quantity + quantity } : i)

        const updatedCarts = [...state.vendorCarts]
        updatedCarts[existingCartIdx] = { ...cart, items: updatedItems }
        return { vendorCarts: updatedCarts }
      }),

      removeItem: (productId, variantId = null) => set(state => {
        const updatedCarts = state.vendorCarts
          .map(vc => ({
            ...vc,
            items: vc.items.filter(i => !(i.product_id === productId && i.variant_id === variantId)),
          }))
          .filter(vc => vc.items.length > 0)
        return { vendorCarts: updatedCarts }
      }),

      updateQty: (productId, quantity, variantId = null) => {
        if (quantity <= 0) { get().removeItem(productId, variantId); return }
        set(state => ({
          vendorCarts: state.vendorCarts.map(vc => ({
            ...vc,
            items: vc.items.map(i =>
              i.product_id === productId && i.variant_id === variantId ? { ...i, quantity } : i
            ),
          })),
        }))
      },

      clearCart: () => set({ vendorCarts: [] }),

      clearVendorCart: (vendorId) => set(state => ({
        vendorCarts: state.vendorCarts.filter(vc => vc.vendorId !== vendorId),
      })),

      total: () => get().vendorCarts.reduce(
        (sum, vc) => sum + vc.items.reduce((s, i) => s + i.product.price * i.quantity, 0), 0
      ),

      vendorTotal: (vendorId) => {
        const cart = get().vendorCarts.find(vc => vc.vendorId === vendorId)
        return cart ? cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0) : 0
      },

      itemCount: () => get().vendorCarts.reduce(
        (sum, vc) => sum + vc.items.reduce((s, i) => s + i.quantity, 0), 0
      ),

      getVendorCart: (vendorId) => get().vendorCarts.find(vc => vc.vendorId === vendorId),

      getAllItems: () => get().vendorCarts.flatMap(vc => vc.items),
    }),
    { name: 'souqna-cart' }
  )
)
