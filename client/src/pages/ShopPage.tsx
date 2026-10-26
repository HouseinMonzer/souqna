import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, X } from 'lucide-react'
import {
  Badge, Breadcrumbs, Button, Checkbox, EmptyState, Input, RadioGroup, RadioItem, Rating, Select, Sheet, SheetContent,
} from '../components/ui'
import { Container } from '../components/layout/Container'
import { ProductGrid } from '../components/commerce/ProductCard'
import { ErrorState } from '../components/commerce/ErrorState'
import { catalog, type ProductQuery, type ProductSort } from '../api/catalog'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import type { Category, Product } from '../types/database.types'

const PAGE_SIZE = 24
const SORTS: ProductSort[] = ['newest', 'popular', 'price-asc', 'price-desc', 'rating']
const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'shop.sortNewest', popular: 'shop.sortPopular', 'price-asc': 'shop.sortPriceAsc', 'price-desc': 'shop.sortPriceDesc', rating: 'shop.sortRating',
}

type Filters = Required<Pick<ProductQuery, 'sort'>> & Omit<ProductQuery, 'page' | 'limit' | 'sort'>

function readFilters(params: URLSearchParams): Filters {
  const number = (key: string) => {
    const value = params.get(key)
    return value === null || value === '' || Number.isNaN(Number(value)) ? undefined : Number(value)
  }
  const sort = params.get('sort') as ProductSort | null
  return {
    search: params.get('search') || undefined,
    category: params.get('category') || undefined,
    minPrice: number('minPrice'),
    maxPrice: number('maxPrice'),
    minRating: number('minRating'),
    inStock: params.get('inStock') === 'true',
    sort: sort && SORTS.includes(sort) ? sort : 'newest',
  }
}

function FilterPanel({ filters, categories, onChange }: {
  filters: Filters
  categories: Category[]
  onChange: (patch: Partial<Filters>) => void
}) {
  const { t } = useTranslation()
  const [min, setMin] = useState(filters.minPrice?.toString() ?? '')
  const [max, setMax] = useState(filters.maxPrice?.toString() ?? '')
  useEffect(() => { setMin(filters.minPrice?.toString() ?? ''); setMax(filters.maxPrice?.toString() ?? '') }, [filters.minPrice, filters.maxPrice])

  const applyPrice = (event?: FormEvent) => {
    event?.preventDefault()
    onChange({ minPrice: min ? Number(min) : undefined, maxPrice: max ? Number(max) : undefined })
  }

  const heading = 'text-sm font-semibold text-fg'
  return (
    <div className="grid gap-7">
      <fieldset className="grid gap-3">
        <legend className={heading}>{t('shop.category')}</legend>
        <RadioGroup value={filters.category ?? 'all'} onValueChange={value => onChange({ category: value === 'all' ? undefined : value })} className="gap-2.5 pt-3">
          <RadioItem value="all" label={t('shop.allCategories')} />
          {categories.map(category => <RadioItem key={category.id} value={category.id} label={category.name} />)}
        </RadioGroup>
      </fieldset>

      <form className="grid gap-3" onSubmit={applyPrice}>
        <span className={heading}>{t('shop.price')}</span>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" inputMode="decimal" min={0} aria-label={t('shop.min')} placeholder={t('shop.min')} value={min} onChange={e => setMin(e.target.value)} onBlur={() => applyPrice()} startIcon={<span className="text-sm">$</span>} />
          <Input type="number" inputMode="decimal" min={0} aria-label={t('shop.max')} placeholder={t('shop.max')} value={max} onChange={e => setMax(e.target.value)} onBlur={() => applyPrice()} startIcon={<span className="text-sm">$</span>} />
        </div>
        <button type="submit" className="sr-only">{t('common.apply')}</button>
      </form>

      <fieldset className="grid gap-3">
        <legend className={heading}>{t('shop.rating')}</legend>
        <RadioGroup value={String(filters.minRating ?? 0)} onValueChange={value => onChange({ minRating: Number(value) || undefined })} className="gap-2.5 pt-3">
          {[4, 3, 0].map(value => (
            <RadioItem
              key={value}
              value={String(value)}
              label={value ? <span className="inline-flex items-center gap-2"><Rating value={value} size={14} />{t('shop.ratingAtLeast', { value })}</span> : t('shop.anyRating')}
            />
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className={heading}>{t('shop.availability')}</legend>
        <Checkbox className="mt-0" label={t('shop.inStockOnly')} checked={!!filters.inStock} onCheckedChange={checked => onChange({ inStock: checked === true })} />
      </fieldset>
    </div>
  )
}

export default function ShopPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Product[]>([])

  usePageTitle(filters.search ? t('shop.searchTitle', { query: filters.search }) : t('shop.title'))

  const categories = useAsync(signal => catalog.categories(signal), [])
  const filterKey = params.toString()
  const result = useAsync(signal => catalog.products({ ...filters, page, limit: PAGE_SIZE }, signal), [filterKey, page])

  // A filter change starts again from page 1; later pages append.
  useEffect(() => { setPage(1); setItems([]) }, [filterKey])
  useEffect(() => {
    if (!result.data) return
    setItems(previous => (result.data!.page === 1 ? result.data!.data : [...previous, ...result.data!.data]))
  }, [result.data])

  const update = (patch: Partial<Filters>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === false || value === '' || (key === 'sort' && value === 'newest')) next.delete(key)
      else next.set(key, String(value))
    }
    setParams(next, { replace: true })
  }

  const categoryName = categories.data?.find(c => c.id === filters.category)?.name
  const chips = [
    filters.search && { key: 'search', label: `“${filters.search}”` },
    categoryName && { key: 'category', label: categoryName },
    (filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      key: 'price',
      label: filters.minPrice !== undefined && filters.maxPrice !== undefined
        ? t('shop.priceRange', { min: filters.minPrice, max: filters.maxPrice })
        : filters.minPrice !== undefined ? t('shop.priceFrom', { min: filters.minPrice }) : t('shop.priceTo', { max: filters.maxPrice }),
    },
    filters.minRating && { key: 'minRating', label: t('shop.ratingAtLeast', { value: filters.minRating }) },
    filters.inStock && { key: 'inStock', label: t('shop.inStockOnly') },
  ].filter(Boolean) as { key: string; label: string }[]

  const removeChip = (key: string) => update(key === 'price' ? { minPrice: undefined, maxPrice: undefined } : { [key]: undefined })
  const clearAll = () => setParams(filters.sort !== 'newest' ? { sort: filters.sort } : {}, { replace: true })
  const total = result.data?.total ?? 0
  const initialLoading = result.loading && page === 1
  const panel = <FilterPanel filters={filters} categories={categories.data ?? []} onChange={update} />

  return (
    <Container className="grid gap-6 py-6 sm:py-8">
      <div className="grid gap-3">
        <Breadcrumbs items={[{ label: t('product.home'), to: '/' }, { label: t('shop.title'), to: filters.search || categoryName ? '/shop' : undefined }, ...(categoryName ? [{ label: categoryName }] : [])]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h1 className="text-3xl font-semibold">{filters.search ? t('shop.searchTitle', { query: filters.search }) : categoryName ?? t('shop.title')}</h1>
            <p className="text-sm text-fg-muted" aria-live="polite">{initialLoading ? t('common.loading') : t('common.results', { count: total })}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" startIcon={<SlidersHorizontal />} onClick={() => setFiltersOpen(true)}>
              {t('shop.filters')}
              {chips.length > 0 && <Badge tone="brand" appearance="solid" size="sm">{chips.length}</Badge>}
            </Button>
            <label className="sr-only" htmlFor="shop-sort">{t('shop.sort')}</label>
            <Select id="shop-sort" value={filters.sort} onChange={e => update({ sort: e.target.value as ProductSort })} className="h-9 w-auto min-w-44 text-sm">
              {SORTS.map(sort => <option key={sort} value={sort}>{t(SORT_LABELS[sort])}</option>)}
            </Select>
          </div>
        </div>
        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2">
            {chips.map(chip => (
              <li key={chip.key}>
                <button
                  type="button"
                  onClick={() => removeChip(chip.key)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 ps-3 pe-2 text-sm hover:border-border-strong"
                  aria-label={`${chip.label} — ${t('common.clear')}`}
                >
                  {chip.label}
                  <X aria-hidden className="size-3.5 text-fg-subtle" />
                </button>
              </li>
            ))}
            <li><Button variant="link" size="sm" onClick={clearAll}>{t('shop.clearAll')}</Button></li>
          </ul>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label={t('shop.filters')}>
          <div className="sticky top-24">{panel}</div>
        </aside>

        <div className="grid min-w-0 content-start gap-6">
          {result.error && !items.length ? (
            <ErrorState onRetry={result.reload} />
          ) : !initialLoading && !items.length ? (
            <EmptyState
              icon={<SlidersHorizontal />}
              title={t('shop.empty')}
              message={t('shop.emptyText')}
              action={chips.length ? clearAll : undefined}
              actionLabel={chips.length ? t('shop.clearAll') : undefined}
            />
          ) : (
            <ProductGrid products={items} loading={initialLoading} skeletons={12} />
          )}
          {items.length > 0 && items.length < total && (
            <Button variant="outline" className="justify-self-center" loading={result.loading} onClick={() => setPage(p => p + 1)}>
              {t('common.seeMore')}
            </Button>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="start"
          title={t('shop.filters')}
          footer={
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clearAll}>{t('shop.clearAll')}</Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>{t('shop.showResults')}</Button>
            </div>
          }
        >
          <div className="py-2">{panel}</div>
        </SheetContent>
      </Sheet>
    </Container>
  )
}
