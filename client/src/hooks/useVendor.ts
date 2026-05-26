import { useEffect, useState } from 'react'
import { vendorService } from '../api/vendors'
import { useAuthStore } from '../store/authStore'
import type { VendorSummary } from '../types/database.types'

export function useVendorSummary() {
  const { user } = useAuthStore()
  const [summary, setSummary] = useState<VendorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!user?.vendor?.id) {
      setSummary(null)
      setLoading(false)
      return
    }
    setLoading(true)
    vendorService.getSummary(user.vendor.id)
      .then(data => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [user?.vendor?.id])
  return { summary, loading }
}
