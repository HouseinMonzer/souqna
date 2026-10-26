import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: Error | null
  reload: () => void
}

/**
 * Runs an async loader when its dependencies change and ignores stale results.
 * Kept deliberately small; server-state caching arrives with TanStack Query.
 */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  // Declared before the fetch effect so it runs first and the fetch sees the latest loader.
  useEffect(() => { loaderRef.current = loader })

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loaderRef.current(controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result) })
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err : new Error(String(err))) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  return { data, loading, error, reload }
}
