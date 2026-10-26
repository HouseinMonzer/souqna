import { useTranslation } from 'react-i18next'
import { WifiOff } from 'lucide-react'
import { EmptyState } from '../ui'

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      className={className}
      icon={<WifiOff />}
      title={t('common.loadError')}
      action={onRetry}
      actionLabel={onRetry ? t('common.retry') : undefined}
    />
  )
}
