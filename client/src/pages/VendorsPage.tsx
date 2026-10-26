import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Store } from 'lucide-react'
import { Breadcrumbs, EmptyState, Input, Pagination } from '../components/ui'
import { Container } from '../components/layout/Container'
import { VendorCard, VendorCardSkeleton } from '../components/commerce/VendorCard'
import { ErrorState } from '../components/commerce/ErrorState'
import { catalog } from '../api/catalog'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'

const PAGE_SIZE = 24

export default function VendorsPage() {
  const { t } = useTranslation()
  usePageTitle(t('vendors.title'))
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [draft, setDraft] = useState(search)

  // Debounce typing into the URL so the list follows without a request per key.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft.trim() === search) return
      const next = new URLSearchParams()
      if (draft.trim()) next.set('q', draft.trim())
      setParams(next, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [draft, search, setParams])

  const { data, loading, error, reload } = useAsync(signal => catalog.vendors({ search, page, limit: PAGE_SIZE }, signal), [search, page])

  return (
    <Container className="grid gap-6 py-6 sm:py-8">
      <Breadcrumbs items={[{ label: t('product.home'), to: '/' }, { label: t('vendors.title') }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold">{t('vendors.title')}</h1>
          <p className="text-fg-muted">{t('vendors.subtitle')}</p>
        </div>
        <Input
          type="search"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={t('vendors.searchPlaceholder')}
          aria-label={t('vendors.searchPlaceholder')}
          startIcon={<Search />}
          className="sm:w-72"
        />
      </div>

      {error ? <ErrorState onRetry={reload} /> : !loading && !data?.data.length ? (
        <EmptyState icon={<Store />} title={t('vendors.empty')} message={search ? t('vendors.emptyText') : undefined} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <li key={i}><VendorCardSkeleton /></li>)
            : data!.data.map(vendor => <li key={vendor.id} className="flex [&>article]:flex-1"><VendorCard vendor={vendor} /></li>)}
        </ul>
      )}
      {data && (
        <Pagination
          page={page}
          total={data.total}
          limit={data.limit}
          onPageChange={next => setParams(prev => { const p = new URLSearchParams(prev); p.set('page', String(next)); return p })}
        />
      )}
    </Container>
  )
}
