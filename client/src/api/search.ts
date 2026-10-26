import { apiFetch } from '../lib/api'

export interface Suggestions {
  products: { id: string; name: string; slug: string; price: number; primary_image: string | null }[]
  vendors: { id: string; store_name: string; slug: string; logo_url: string | null }[]
}

export async function fetchSuggestions(q: string, signal?: AbortSignal): Promise<Suggestions> {
  const response = await apiFetch<{ data: Suggestions }>(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal })
  return response.data
}
