import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, ImageOff } from 'lucide-react'
import { Badge, PriceTag, ProductCardSkeleton, Rating } from '../ui'
import type { Product } from '../../types/database.types'
import { WishlistButton } from './WishlistButton'

export function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const vendor = product.vendor ?? product.vendors
  const soldOut = product.stock <= 0

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[box-shadow,border-color] duration-(--duration-base) hover:border-border-strong hover:shadow-md focus-within:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-(--duration-slow) ease-(--ease-standard) group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-fg-subtle"><ImageOff aria-hidden className="size-8" /></div>
        )}
        <div className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {soldOut && <Badge tone="neutral" appearance="solid" size="sm">{t('product.outOfStock')}</Badge>}
          {!soldOut && product.stock <= 5 && <Badge tone="warning" size="sm">{t('product.lowStock', { count: product.stock })}</Badge>}
        </div>
        <WishlistButton productId={product.id} className="absolute end-2.5 top-2.5 z-[2]" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {vendor && (
          <p className="flex items-center gap-1 truncate text-xs text-fg-muted">
            <span className="truncate">{vendor.store_name}</span>
            {vendor.verified && <BadgeCheck aria-label={t('product.verified')} className="size-3.5 shrink-0 text-primary" />}
          </p>
        )}
        <h3 className="line-clamp-2 font-sans text-sm font-semibold leading-snug text-fg">
          {/* The stretched link makes the whole card clickable while keeping one link in the a11y tree. */}
          <Link to={`/product/${product.slug}`} className="after:absolute after:inset-0 after:z-[1] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        {product.total_reviews > 0 && <Rating value={product.rating} count={product.total_reviews} size={12} className="[&>span:last-child]:text-xs" />}
        <PriceTag price={product.price} comparePrice={product.compare_price} size="sm" className="mt-auto pt-1" />
      </div>
    </article>
  )
}

export function ProductGrid({ products, loading, skeletons = 8 }: { products?: Product[]; loading?: boolean; skeletons?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {loading
        ? Array.from({ length: skeletons }, (_, i) => <li key={i}><ProductCardSkeleton /></li>)
        : products?.map(product => <li key={product.id} className="flex [&>article]:flex-1"><ProductCard product={product} /></li>)}
    </ul>
  )
}
