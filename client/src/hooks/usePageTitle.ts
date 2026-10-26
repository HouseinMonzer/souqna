import { useEffect } from 'react'

/** Sets the browser tab title as "<title> · SouQna" (or just SouQna). */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · SouQna` : 'SouQna — Lebanon’s marketplace'
  }, [title])
}
