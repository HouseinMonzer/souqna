const API_BASE = import.meta.env.VITE_API_URL || ''

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    })
  } catch {
    throw new Error('Network error. Please check your connection and try again.')
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || body?.error || response.statusText || 'Request failed')
  }
  return body as T
}
