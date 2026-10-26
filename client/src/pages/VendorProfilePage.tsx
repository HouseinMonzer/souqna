import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, CalendarDays, Globe, MapPin, MessageCircle, MessageSquare, Phone, Search, Store } from 'lucide-react'
import {
  Avatar, Breadcrumbs, Button, EmptyState, Input, Pagination, Rating, Select, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger,
} from '../components/ui'
import { PlatformIcon } from '../components/icons/SocialIcons'
import { Container } from '../components/layout/Container'
import { ProductGrid } from '../components/commerce/ProductCard'
import { ErrorState } from '../components/commerce/ErrorState'
import { catalog, reviews, type ProductSort } from '../api/catalog'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { safeExternalUrl } from '../lib/utils'
import type { Vendor } from '../types/database.types'

const SORTS: ProductSort[] = ['newest', 'popular', 'price-asc', 'price-desc']
const SORT_LABELS: Record<string, string> = { newest: 'shop.sortNewest', popular: 'shop.sortPopular', 'price-asc': 'shop.sortPriceAsc', 'price-desc': 'shop.sortPriceDesc' }

function socialLinks(vendor: Vendor) {
  const handle = (value: string | null, base: string) => {
    if (!value) return null
    return safeExternalUrl(value.startsWith('http') ? value : `${base}${value.replace(/^@/, '')}`)
  }
  return [
    { platform: 'instagram', label: 'Instagram', href: handle(vendor.instagram, 'https://instagram.com/') },
    { platform: 'facebook', label: 'Facebook', href: handle(vendor.facebook, 'https://facebook.com/') },
    { platform: 'tiktok', label: 'TikTok', href: handle(vendor.tiktok, 'https://tiktok.com/@') },
    { platform: 'youtube', label: 'YouTube', href: handle(vendor.youtube, 'https://youtube.com/@') },
  ].filter((link): link is { platform: string; label: string; href: string } => Boolean(link.href))
}

function StoreProducts({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ProductSort>('newest')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(
    signal => catalog.products({ vendor: vendorId, search: search.trim() || undefined, sort, page, limit: 24 }, signal),
    [vendorId, search, sort, page],
  )
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={t('vendors.searchStore')} aria-label={t('vendors.searchStore')} startIcon={<Search />} className="sm:w-72" />
        <Select value={sort} onChange={e => { setSort(e.target.value as ProductSort); setPage(1) }} aria-label={t('shop.sort')} className="h-11 w-auto">
          {SORTS.map(s => <option key={s} value={s}>{t(SORT_LABELS[s])}</option>)}
        </Select>
      </div>
      {error ? <ErrorState onRetry={reload} /> : !loading && !data?.data.length
        ? <EmptyState icon={<Store />} title={search ? t('shop.empty') : t('vendors.noProducts')} />
        : <ProductGrid products={data?.data} loading={loading} skeletons={8} />}
      {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
    </div>
  )
}

function StoreReviews({ vendorId }: { vendorId: string }) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const { data, loading } = useAsync(signal => reviews.forVendor(vendorId, page, signal), [vendorId, page])
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })
  if (loading && !data) return <div className="grid gap-3">{[0, 1].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
  if (!data?.data.length) return <EmptyState icon={<MessageSquare />} title={t('vendors.noReviews')} className="py-10" />
  return (
    <div className="grid max-w-3xl gap-4">
      <ul className="grid gap-4">
        {data.data.map(review => (
          <li key={review.id} className="grid gap-2 border-b border-border pb-4 last:border-0">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={review.author_name} size="sm" />
              <div className="grid">
                <span className="text-sm font-semibold">{review.author_name}</span>
                <span className="text-xs text-fg-subtle">
                  {dateFormat.format(new Date(review.created_at))}
                  {review.product_name && <> · {t('vendors.reviewOn', { product: review.product_name })}</>}
                </span>
              </div>
              <Rating value={review.rating} size={14} className="ms-auto" />
            </div>
            {review.title && <p className="font-semibold">{review.title}</p>}
            {review.body && <p className="text-sm text-fg-muted">{review.body}</p>}
          </li>
        ))}
      </ul>
      <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />
    </div>
  )
}

export default function VendorProfilePage() {
  const { slug = '' } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: vendor, loading, error, reload } = useAsync(signal => catalog.vendor(slug, signal), [slug])
  usePageTitle(vendor?.store_name ?? (loading ? undefined : t('vendors.notFound')))
  const links = useMemo(() => (vendor ? socialLinks(vendor) : []), [vendor])

  if (loading) {
    return (
      <div>
        <Skeleton className="h-40 rounded-none sm:h-56" />
        <Container className="grid gap-3 py-6"><Skeleton className="size-24 rounded-xl" /><Skeleton className="h-8 w-60" /></Container>
      </div>
    )
  }
  if (error) return <Container className="py-16"><ErrorState onRetry={reload} /></Container>
  if (!vendor) {
    return <Container className="py-16"><EmptyState icon={<Store />} title={t('vendors.notFound')} message={t('vendors.notFoundText')} action={() => navigate('/vendors')} actionLabel={t('vendors.title')} /></Container>
  }

  const website = safeExternalUrl(vendor.website)
  const whatsapp = vendor.whatsapp?.replace(/\D/g, '')
  const joined = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(vendor.joined_at))

  return (
    <div>
      <div className="h-40 bg-gradient-to-br from-brand-200 via-brand-400 to-brand-700 sm:h-56 dark:from-brand-900 dark:via-brand-800 dark:to-brand-950">
        {vendor.cover_url && <img src={vendor.cover_url} alt="" className="size-full object-cover" />}
      </div>
      <Container className="grid gap-6 pb-10">
        <div className="-mt-12 flex flex-wrap items-end gap-4 sm:-mt-14">
          <Avatar name={vendor.store_name} src={vendor.logo_url} size="xl" shape="square" className="size-24 border-4 border-bg shadow-md sm:size-28" />
          <div className="grid min-w-0 flex-1 gap-1 pb-1">
            <h1 className="flex items-center gap-2 text-3xl font-semibold">
              <span className="truncate">{vendor.store_name}</span>
              {vendor.verified && <BadgeCheck aria-label={t('vendors.verified')} className="size-6 shrink-0 text-primary" />}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
              {vendor.total_reviews > 0 && <Rating value={vendor.rating} count={vendor.total_reviews} showValue size={14} />}
              {vendor.location && <span className="inline-flex items-center gap-1"><MapPin aria-hidden className="size-4" />{vendor.location}</span>}
              <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden className="size-4" />{t('vendors.joined', { date: joined })}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <Button asChild variant="accent" startIcon={<MessageCircle />}>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">{t('vendors.whatsapp')}</a>
              </Button>
            )}
            {website && (
              <Button asChild variant="outline" startIcon={<Globe />}>
                <a href={website} target="_blank" rel="noopener noreferrer">{t('vendors.website')}</a>
              </Button>
            )}
          </div>
        </div>

        <Breadcrumbs items={[{ label: t('product.home'), to: '/' }, { label: t('vendors.title'), to: '/vendors' }, { label: vendor.store_name }]} />

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">{t('vendors.products')}</TabsTrigger>
            <TabsTrigger value="about">{t('vendors.about')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('vendors.reviews')}{vendor.total_reviews ? ` (${vendor.total_reviews})` : ''}</TabsTrigger>
          </TabsList>
          <TabsContent value="products"><StoreProducts vendorId={vendor.id} /></TabsContent>
          <TabsContent value="about">
            <div className="grid max-w-3xl gap-6 md:grid-cols-[1fr_16rem]">
              <p className="whitespace-pre-line text-fg-muted">{vendor.description || t('vendors.noDescription')}</p>
              <dl className="grid content-start gap-3 rounded-lg bg-surface-muted p-4 text-sm">
                {vendor.location && <div><dt className="font-semibold">{t('vendors.location')}</dt><dd className="text-fg-muted">{vendor.address || vendor.location}</dd></div>}
                {vendor.phone && <div><dt className="font-semibold">{t('vendors.contact')}</dt><dd className="inline-flex items-center gap-1.5 text-fg-muted"><Phone aria-hidden className="size-3.5" /><bdi>{vendor.phone}</bdi></dd></div>}
                {links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {links.map(link => {
                      const Icon = PlatformIcon[link.platform]
                      return (
                        <a key={link.platform} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}
                          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface text-fg-muted hover:text-fg">
                          {Icon ? <Icon size={16} /> : link.label[0]}
                        </a>
                      )
                    })}
                  </div>
                )}
              </dl>
            </div>
          </TabsContent>
          <TabsContent value="reviews"><StoreReviews vendorId={vendor.id} /></TabsContent>
        </Tabs>
      </Container>
    </div>
  )
}
