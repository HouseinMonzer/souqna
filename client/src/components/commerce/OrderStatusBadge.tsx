import { useTranslation } from 'react-i18next'
import { Badge } from '../ui'
import type { OrderStatus } from '../../types/database.types'

const TONES = {
  pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'brand', delivered: 'success', cancelled: 'neutral', refunded: 'neutral',
} as const

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  return <Badge tone={TONES[status] ?? 'neutral'}>{t(`status.${status}`)}</Badge>
}
