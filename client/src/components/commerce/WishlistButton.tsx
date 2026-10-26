import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import { IconButton, toast } from '../ui'
import { useAuthStore } from '../../store/authStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { cn } from '../../lib/utils'

export function WishlistButton({ productId, className, variant = 'overlay' }: { productId: string; className?: string; variant?: 'overlay' | 'outline' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const saved = useWishlistStore(s => s.ids.has(productId))
  const toggle = useWishlistStore(s => s.toggle)

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!user) {
      toast({ title: t('product.signInToSave') })
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }
    try {
      const nowSaved = await toggle(productId)
      toast({ title: nowSaved ? t('product.saved') : t('product.removed'), tone: nowSaved ? 'success' : 'neutral' })
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : t('common.loadError'), tone: 'danger' })
    }
  }

  return (
    <IconButton
      label={saved ? t('product.unsave') : t('product.save')}
      aria-pressed={saved}
      onClick={onClick}
      size={variant === 'overlay' ? 'icon-sm' : 'icon'}
      variant={variant === 'overlay' ? 'ghost' : 'outline'}
      className={cn(variant === 'overlay' && 'bg-surface/85 shadow-sm backdrop-blur hover:bg-surface', className)}
      icon={<Heart className={cn('transition-colors', saved && 'fill-accent text-accent')} />}
    />
  )
}
