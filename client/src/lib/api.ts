const API_BASE = import.meta.env.VITE_API_URL || ''

/** An HTTP error from the API, keeping the status and parsed body for callers that need them. */
export class ApiError extends Error {
  status: number
  body: Record<string, unknown> | null

  constructor(message: string, status: number, body: Record<string, unknown> | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

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
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('Network error. Please check your connection and try again.', { cause: error })
  }

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(body?.message || body?.error || response.statusText || 'Request failed', response.status, body)
  }
  return body as T
}
