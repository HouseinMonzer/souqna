import { create } from 'zustand'
import { apiFetch } from '../lib/api'

interface WishlistState {
  ids: Set<string>
  loaded: boolean
  load: () => Promise<void>
  reset: () => void
  /** Optimistically toggles; returns the new saved state. Throws if the request fails. */
  toggle: (productId: string) => Promise<boolean>
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  loaded: false,
  load: async () => {
    const response = await apiFetch<{ data: { id: string }[] }>('/api/wishlist')
    set({ ids: new Set(response.data.map(p => p.id)), loaded: true })
  },
  reset: () => set({ ids: new Set(), loaded: false }),
  toggle: async productId => {
    const wasSaved = get().ids.has(productId)
    const flip = (saved: boolean) => set(state => {
      const ids = new Set(state.ids)
      if (saved) ids.add(productId)
      else ids.delete(productId)
      return { ids }
    })
    flip(!wasSaved)
    try {
      if (wasSaved) await apiFetch(`/api/wishlist/${productId}`, { method: 'DELETE' })
      else await apiFetch('/api/wishlist', { method: 'POST', body: JSON.stringify({ productId }) })
      return !wasSaved
    } catch (error) {
      flip(wasSaved)
      throw error
    }
  },
}))
