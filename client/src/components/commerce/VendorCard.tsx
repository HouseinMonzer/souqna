import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, MapPin } from 'lucide-react'
import { Avatar, Rating, Skeleton } from '../ui'
import type { Vendor } from '../../types/database.types'

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const { t } = useTranslation()
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[box-shadow,border-color] duration-(--duration-base) hover:border-border-strong hover:shadow-md">
      <div className="h-20 bg-gradient-to-br from-brand-200 to-brand-500 dark:from-brand-900 dark:to-brand-700">
        {vendor.cover_url && <img src={vendor.cover_url} alt="" loading="lazy" className="size-full object-cover" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <Avatar name={vendor.store_name} src={vendor.logo_url} size="lg" shape="square" className="-mt-7 border-4 border-surface shadow-sm" />
        <h3 className="flex items-center gap-1.5 font-sans text-base font-semibold">
          <Link to={`/vendors/${vendor.slug}`} className="truncate after:absolute after:inset-0 focus-visible:outline-none">{vendor.store_name}</Link>
          {vendor.verified && <BadgeCheck aria-label={t('product.verified')} className="size-4 shrink-0 text-primary" />}
        </h3>
        {vendor.description && <p className="line-clamp-2 text-sm text-fg-muted">{vendor.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-fg-muted">
          {vendor.total_reviews > 0 && <Rating value={vendor.rating} size={12} showValue className="[&>span:last-child]:text-xs" />}
          {vendor.location && <span className="inline-flex items-center gap-1"><MapPin aria-hidden className="size-3.5" />{vendor.location}</span>}
        </div>
      </div>
    </article>
  )
}

export function VendorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface" aria-hidden>
      <Skeleton className="h-20 rounded-none" />
      <div className="grid gap-2 px-4 pb-4">
        <Skeleton className="-mt-7 size-14 rounded-md border-4 border-surface" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}
