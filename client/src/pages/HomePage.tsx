import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight, BadgeCheck, BookOpen, Dumbbell, Gem, Gift, Home as HomeIcon, Laptop, Leaf, Shirt, Sparkles, Store, Truck,
  UtensilsCrossed, Wallet, type LucideIcon,
} from 'lucide-react'
import { Button, Skeleton } from '../components/ui'
import { Container } from '../components/layout/Container'
import { ProductGrid } from '../components/commerce/ProductCard'
import { VendorCard, VendorCardSkeleton } from '../components/commerce/VendorCard'
import { SectionHeader } from '../components/commerce/SectionHeader'
import { ErrorState } from '../components/commerce/ErrorState'
import { catalog } from '../api/catalog'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'

// Icon by keyword in the category slug; categories are created by vendors, so
// anything unrecognised gets the generic shop icon.
const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
  [/food|grocer|bever|spice|sweet/, UtensilsCrossed],
  [/fashion|cloth|wear|shoe/, Shirt],
  [/electr|tech|phone|computer/, Laptop],
  [/book|station/, BookOpen],
  [/sport|fitness/, Dumbbell],
  [/craft|gift|art/, Gift],
  [/beauty|cosmet|soap|care/, Sparkles],
  [/home|decor|furni|kitchen/, HomeIcon],
  [/jewel|access/, Gem],
  [/organic|plant|garden|farm/, Leaf],
]
const iconFor = (slug: string) => CATEGORY_ICONS.find(([pattern]) => pattern.test(slug))?.[1] ?? Store

function Hero({ images }: { images: string[] }) {
  const { t } = useTranslation()
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface-muted">
      {/* A faint tile pattern, a nod to the zellige and cement tiles of old Beirut houses. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-conic-gradient(var(--color-brand-700)_0_25%,transparent_0_50%)] [background-size:28px_28px] dark:opacity-[0.05] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <Container className="relative grid items-center gap-10 py-12 md:grid-cols-[1.1fr_1fr] md:py-16 lg:py-20">
        <div className="grid gap-5">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-fg-muted">
            <span aria-hidden className="size-2 rounded-full bg-accent" />
            {t('home.eyebrow')}
          </p>
          <h1 className="max-w-xl text-4xl font-semibold text-balance sm:text-5xl">{t('home.heading')}</h1>
          <p className="max-w-lg text-lg text-fg-muted">{t('home.subheading')}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" variant="accent" endIcon={<ArrowRight className="rtl:rotate-180" />}>
              <Link to="/shop">{t('home.shopNow')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline"><Link to="/register">{t('home.sell')}</Link></Button>
          </div>
        </div>
        <div aria-hidden className="hidden grid-cols-2 gap-3 md:grid">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`overflow-hidden rounded-xl bg-surface shadow-md ${i % 2 ? 'translate-y-6' : ''}`}>
              {images[i] ? <img src={images[i]} alt="" className="aspect-[4/5] w-full object-cover" /> : <Skeleton className="aspect-[4/5] h-auto w-full rounded-none" />}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function TrustStrip() {
  const { t } = useTranslation()
  const items = [
    { icon: BadgeCheck, title: t('home.trustVerified'), text: t('home.trustVerifiedText') },
    { icon: Wallet, title: t('home.trustPayment'), text: t('home.trustPaymentText') },
    { icon: Truck, title: t('home.trustDelivery'), text: t('home.trustDeliveryText') },
  ]
  return (
    <Container>
      <ul className="grid gap-4 py-8 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg"><Icon aria-hidden className="size-5" /></span>
            <div className="grid gap-0.5">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-sm text-fg-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  )
}

function Categories() {
  const { t } = useTranslation()
  const { data, loading } = useAsync(signal => catalog.categories(signal), [])
  if (!loading && !data?.length) return null
  return (
    <Container className="grid gap-5 py-10">
      <SectionHeader title={t('home.categories')} to="/shop" linkLabel={t('common.viewAll')} />
      <ul className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-4 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <li key={i} className="w-32 shrink-0 sm:w-auto"><Skeleton className="h-24 rounded-lg" /></li>)
          : data!.map(category => {
              const Icon = iconFor(category.slug)
              return (
                <li key={category.id} className="w-32 shrink-0 sm:w-auto">
                  <Link
                    to={`/shop?category=${category.id}`}
                    className="flex h-full flex-col items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-5 text-center transition-[border-color,box-shadow] hover:border-primary hover:shadow-sm"
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"><Icon aria-hidden className="size-5" /></span>
                    <span className="text-sm font-medium leading-tight">{category.name}</span>
                  </Link>
                </li>
              )
            })}
      </ul>
    </Container>
  )
}

function ProductSection({ title, description, sort, limit }: { title: string; description?: string; sort: 'popular' | 'newest'; limit: number }) {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(signal => catalog.products({ sort, limit }, signal), [sort, limit])
  return (
    <Container className="grid gap-5 py-10">
      <SectionHeader title={title} description={description} to={`/shop?sort=${sort}`} linkLabel={t('common.viewAll')} />
      {error ? <ErrorState onRetry={reload} /> : !loading && !data?.data.length
        ? <p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-fg-muted">{t('home.noProducts')}</p>
        : <ProductGrid products={data?.data} loading={loading} skeletons={limit} />}
    </Container>
  )
}

function Vendors() {
  const { t } = useTranslation()
  const { data, loading } = useAsync(signal => catalog.vendors({ limit: 6 }, signal), [])
  if (!loading && !data?.data.length) return null
  return (
    <section className="border-y border-border bg-surface-muted">
      <Container className="grid gap-5 py-12">
        <SectionHeader title={t('home.vendors')} description={t('home.vendorsText')} to="/vendors" linkLabel={t('common.viewAll')} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }, (_, i) => <li key={i}><VendorCardSkeleton /></li>)
            : data!.data.map(vendor => <li key={vendor.id} className="flex [&>article]:flex-1"><VendorCard vendor={vendor} /></li>)}
        </ul>
      </Container>
    </section>
  )
}

function SellerCta() {
  const { t } = useTranslation()
  return (
    <Container className="py-12">
      <div className="relative overflow-hidden rounded-xl bg-primary px-6 py-10 text-primary-fg sm:px-10 md:py-14">
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full bg-primary-fg/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 end-24 size-48 rounded-full bg-primary-fg/5" />
        <div className="relative grid max-w-xl gap-4">
          <h2 className="text-3xl font-semibold text-balance">{t('home.ctaTitle')}</h2>
          <p className="opacity-85">{t('home.ctaText')}</p>
          <Button asChild size="lg" variant="accent" className="w-fit" endIcon={<ArrowRight className="rtl:rotate-180" />}>
            <Link to="/register">{t('home.ctaButton')}</Link>
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  usePageTitle(t('home.title'))
  const hero = useAsync(signal => catalog.products({ sort: 'popular', limit: 4 }, signal), [])
  const heroImages = (hero.data?.data ?? []).map(p => p.primary_image).filter((src): src is string => Boolean(src))

  return (
    <>
      <Hero images={heroImages} />
      <TrustStrip />
      <Categories />
      <ProductSection title={t('home.trending')} description={t('home.trendingText')} sort="popular" limit={8} />
      <Vendors />
      <ProductSection title={t('home.newArrivals')} sort="newest" limit={4} />
      <SellerCta />
    </>
  )
}
