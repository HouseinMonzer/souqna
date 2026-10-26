import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import { Button, EmptyState } from '../../components/ui'
import { ProductGrid } from '../../components/commerce/ProductCard'
import { ErrorState } from '../../components/commerce/ErrorState'
import { wishlist } from '../../api/account'
import { useAsync } from '../../hooks/useAsync'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useWishlistStore } from '../../store/wishlistStore'

export default function WishlistPage() {
  const { t } = useTranslation()
  usePageTitle(t('account.wishlist'))
  const ids = useWishlistStore(s => s.ids)
  const { data, loading, error, reload } = useAsync(signal => wishlist.list(signal), [])
  // Hide items un-saved on this page without refetching.
  const products = data?.filter(product => ids.has(product.id))

  return (
    <div className="grid gap-5">
      <h1 className="text-3xl font-semibold">{t('account.wishlist')}</h1>
      {error ? <ErrorState onRetry={reload} /> : !loading && !products?.length ? (
        <EmptyState icon={<Heart />} title={t('account.noWishlist')} message={t('account.noWishlistText')} action={<Button asChild><Link to="/shop">{t('cart.startShopping')}</Link></Button>} />
      ) : (
        <ProductGrid products={products} loading={loading} skeletons={4} />
      )}
    </div>
  )
}
