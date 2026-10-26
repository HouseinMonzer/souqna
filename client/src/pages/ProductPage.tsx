import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, MessageSquare, PackageX, ShoppingBag, Truck, Wallet } from 'lucide-react'
import {
  Avatar, Badge, Breadcrumbs, Button, EmptyState, FormField, ImageGallery, Input, Pagination, PriceTag, QuantityStepper,
  Rating, RatingInput, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, toast,
} from '../components/ui'
import { Container } from '../components/layout/Container'
import { ProductGrid } from '../components/commerce/ProductCard'
import { WishlistButton } from '../components/commerce/WishlistButton'
import { ErrorState } from '../components/commerce/ErrorState'
import { catalog, reviews as reviewsApi, type ReviewPage } from '../api/catalog'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { productImages, toCartProduct } from '../lib/product'
import { cn } from '../lib/utils'
import type { Product, ProductVariant } from '../types/database.types'

function ProductJsonLd({ product }: { product: Product }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description || product.description || undefined,
    image: productImages(product).map(i => i.src),
    brand: product.vendor ? { '@type': 'Brand', name: product.vendor.store_name } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.total_reviews > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.total_reviews } } : {}),
  }
  return <script type="application/ld+json">{JSON.stringify(data)}</script>
}

function ReviewForm({ productId, onPosted }: { productId: string; onPosted: () => void }) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!rating) return
    setSaving(true)
    setError('')
    try {
      await reviewsApi.submit(productId, { rating, title: title || undefined, body: body || undefined })
      toast({ title: t('product.reviewPosted'), tone: 'success' })
      setTitle('')
      setBody('')
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-surface p-5">
      <h3 className="font-sans text-base font-semibold">{t('product.writeReview')}</h3>
      <RatingInput value={rating} onChange={setRating} label={t('product.yourReview')} />
      <FormField label={t('product.reviewTitle')}>
        <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
      </FormField>
      <FormField label={t('product.reviewBody')} error={error || undefined}>
        <Textarea value={body} onChange={e => setBody(e.target.value)} maxLength={2000} rows={3} />
      </FormField>
      <Button type="submit" className="w-fit" disabled={!rating} loading={saving}>{t('product.submitReview')}</Button>
    </form>
  )
}

function Reviews({ product }: { product: Product }) {
  const { t, i18n } = useTranslation()
  const user = useAuthStore(s => s.user)
  const [page, setPage] = useState(1)
  const { data, loading, reload } = useAsync<ReviewPage>(signal => reviewsApi.list(product.id, page, signal), [product.id, page])
  const summary = data?.summary
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' })

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="grid content-start gap-4">
        {summary && summary.count > 0 && (
          <div className="grid gap-3 rounded-lg bg-surface-muted p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums">{summary.average.toFixed(1)}</span>
              <Rating value={summary.average} size={16} />
            </div>
            <ul className="grid gap-1.5">
              {(['5', '4', '3', '2', '1'] as const).map(stars => {
                const count = summary.breakdown[stars]
                return (
                  <li key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-14 shrink-0 text-fg-muted">{t('ui.stars', { count: Number(stars) })}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                      <span className="block h-full rounded-full bg-star" style={{ width: `${(count / summary.count) * 100}%` }} />
                    </span>
                    <span className="w-6 text-end tabular-nums text-fg-subtle">{count}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {user ? <ReviewForm productId={product.id} onPosted={reload} /> : (
          <p className="text-sm text-fg-muted">{t('product.reviewOnlyBuyers')}</p>
        )}
      </div>
      <div className="grid content-start gap-4">
        {loading && !data ? (
          Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : !data?.data.length ? (
          <EmptyState icon={<MessageSquare />} title={t('product.noReviews')} message={t('product.noReviewsText')} className="py-10" />
        ) : (
          <>
            <ul className="grid gap-4">
              {data.data.map(review => (
                <li key={review.id} className="grid gap-2 border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={review.author_name} size="sm" />
                    <div className="grid">
                      <span className="text-sm font-semibold">{review.author_name}</span>
                      <span className="text-xs text-fg-subtle">{dateFormat.format(new Date(review.created_at))}</span>
                    </div>
                    <Rating value={review.rating} size={14} className="ms-auto" />
                  </div>
                  {review.title && <p className="font-semibold">{review.title}</p>}
                  {review.body && <p className="text-sm text-fg-muted">{review.body}</p>}
                </li>
              ))}
            </ul>
            <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <Container className="grid gap-8 py-8 md:grid-cols-2">
      <Skeleton className="aspect-square h-auto rounded-lg" />
      <div className="grid content-start gap-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-12 w-full" />
      </div>
    </Container>
  )
}

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const addItem = useCartStore(s => s.addItem)
  const { data: product, loading, error, reload } = useAsync(signal => catalog.product(slug, signal), [slug])
  const related = useAsync(
    signal => (product?.category_id ? catalog.related(product.category_id, product.id, signal) : Promise.resolve([])),
    [product?.id],
  )
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState<Record<string, ProductVariant>>({})

  usePageTitle(product?.name ?? (loading ? undefined : t('product.notFound')))
  useEffect(() => { setQty(1); setSelected({}) }, [slug])

  // Variants arrive as flat rows; group them into option sets (e.g. Size: S/M/L).
  const optionGroups = useMemo(() => {
    const groups = new Map<string, ProductVariant[]>()
    for (const variant of product?.product_variants ?? []) {
      groups.set(variant.option_name, [...(groups.get(variant.option_name) ?? []), variant])
    }
    return [...groups.entries()]
  }, [product])

  if (loading) return <ProductSkeleton />
  if (error) return <Container className="py-16"><ErrorState onRetry={reload} /></Container>
  if (!product) {
    return (
      <Container className="py-16">
        <EmptyState icon={<PackageX />} title={t('product.notFound')} message={t('product.notFoundText')} action={() => navigate('/shop')} actionLabel={t('notFound.shop')} />
      </Container>
    )
  }

  const vendor = product.vendor ?? product.vendors
  // The cart and price follow the first selected option; multi-option products
  // are rare on SouQna today.
  const variant = Object.values(selected)[0] ?? null
  const price = product.price + (variant?.price_adjustment ?? 0)
  const stock = variant ? variant.stock : product.stock
  const soldOut = stock <= 0
  const needsVariant = optionGroups.length > 0 && !variant

  const addToCart = () => {
    addItem({ ...toCartProduct(product), price }, qty, variant)
    toast({
      title: t('product.added'),
      description: t('product.addedText', { name: product.name }),
      tone: 'success',
      action: { label: t('product.viewCart'), onClick: () => navigate('/cart') },
    })
  }

  const buyButton = (
    <Button size="lg" variant="accent" className="flex-1" startIcon={<ShoppingBag />} disabled={soldOut || needsVariant} onClick={addToCart}>
      {soldOut ? t('product.outOfStock') : t('product.addToCart')}
    </Button>
  )

  return (
    <>
      <ProductJsonLd product={product} />
      <Container className="grid gap-6 py-6 sm:py-8">
        <Breadcrumbs items={[
          { label: t('product.home'), to: '/' },
          { label: t('product.shop'), to: '/shop' },
          ...(product.category ? [{ label: product.category.name, to: `/shop?category=${product.category.id}` }] : []),
          { label: product.name },
        ]} />

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <ImageGallery images={productImages(product)} className="md:sticky md:top-24 md:self-start" />

          <div className="grid content-start gap-5">
            <div className="grid gap-2">
              {vendor && (
                <Link to={`/vendors/${vendor.slug}`} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
                  {vendor.store_name}
                  {vendor.verified && <BadgeCheck aria-label={t('product.verified')} className="size-4 text-primary" />}
                </Link>
              )}
              <h1 className="text-3xl font-semibold text-balance">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
                {product.total_reviews > 0 && <Rating value={product.rating} count={product.total_reviews} showValue size={16} />}
                {product.total_sold > 0 && <span>{t('product.sold', { count: product.total_sold })}</span>}
              </div>
            </div>

            <PriceTag price={price} comparePrice={product.compare_price} size="lg" />

            {product.short_description && <p className="text-fg-muted">{product.short_description}</p>}

            {optionGroups.map(([name, options]) => (
              <fieldset key={name} className="grid gap-2">
                <legend className="text-sm font-semibold">{name}</legend>
                <div className="flex flex-wrap gap-2 pt-2">
                  {options.map(option => {
                    const active = selected[name]?.id === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        disabled={option.stock <= 0}
                        onClick={() => setSelected({ [name]: option })}
                        className={cn(
                          'min-w-12 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40',
                          active ? 'border-primary bg-primary-soft text-primary-soft-fg' : 'border-border-strong hover:border-primary',
                        )}
                      >
                        {option.option_value}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}

            <div>
              {soldOut ? <Badge tone="neutral">{t('product.outOfStock')}</Badge>
                : stock <= 5 ? <Badge tone="warning">{t('product.lowStock', { count: stock })}</Badge>
                  : <Badge tone="success">{t('product.inStock')}</Badge>}
            </div>

            <div className="hidden flex-wrap items-center gap-3 sm:flex">
              <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(stock, 99))} disabled={soldOut} />
              {buyButton}
              <WishlistButton productId={product.id} variant="outline" />
            </div>

            <ul className="grid gap-2.5 rounded-lg border border-border p-4 text-sm">
              <li className="flex items-center gap-2.5"><Truck aria-hidden className="size-4 text-fg-subtle" />{t('product.delivery')}</li>
              <li className="flex items-center gap-2.5"><Wallet aria-hidden className="size-4 text-fg-subtle" />{t('product.payOnDelivery')}</li>
            </ul>

            {vendor && (
              <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-4">
                <Avatar name={vendor.store_name} src={vendor.logo_url} shape="square" />
                <div className="grid min-w-0 flex-1">
                  <span className="text-xs text-fg-muted">{t('product.soldBy')}</span>
                  <span className="truncate font-semibold">{vendor.store_name}</span>
                </div>
                <Button asChild variant="outline" size="sm"><Link to={`/vendors/${vendor.slug}`}>{t('product.visitStore')}</Link></Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="description" className="pt-6">
          <TabsList>
            <TabsTrigger value="description">{t('product.description')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('product.reviews')} ({product.total_reviews})</TabsTrigger>
          </TabsList>
          <TabsContent value="description">
            <p className="max-w-prose whitespace-pre-line text-fg-muted">{product.description || product.short_description || '—'}</p>
          </TabsContent>
          <TabsContent value="reviews"><Reviews product={product} /></TabsContent>
        </Tabs>

        {!!related.data?.length && (
          <section className="grid gap-5 border-t border-border pt-10">
            <h2 className="text-2xl font-semibold">{t('product.related')}</h2>
            <ProductGrid products={related.data} />
          </section>
        )}
      </Container>

      {/* Phones: keep the purchase action in reach while scrolling. */}
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-2">
          <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(stock, 99))} size="sm" disabled={soldOut} />
          {buyButton}
          <WishlistButton productId={product.id} variant="outline" />
        </div>
      </div>
      <div aria-hidden className="h-20 sm:hidden" />
    </>
  )
}
