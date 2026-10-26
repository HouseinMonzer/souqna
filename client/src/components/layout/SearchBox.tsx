import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Store } from 'lucide-react'
import { fetchSuggestions, type Suggestions } from '../../api/search'
import { formatPrice } from '../ui'
import { cn } from '../../lib/utils'

const DEBOUNCE_MS = 250

interface Option {
  key: string
  label: string
  meta?: string
  image?: string | null
  to: string
  kind: 'product' | 'vendor' | 'all'
}

/** Search field with live suggestions, built as an ARIA combobox. */
export function SearchBox({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Suggestions | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const term = query.trim()

  useEffect(() => {
    if (term.length < 2) {
      setResults(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchSuggestions(term, controller.signal).then(setResults).catch(() => {})
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  const options: Option[] = term.length < 2 ? [] : [
    ...(results?.products ?? []).map(p => ({
      key: `p-${p.id}`, label: p.name, meta: formatPrice(p.price), image: p.primary_image, to: `/product/${p.slug}`, kind: 'product' as const,
    })),
    ...(results?.vendors ?? []).map(v => ({
      key: `v-${v.id}`, label: v.store_name, image: v.logo_url, to: `/vendors/${v.slug}`, kind: 'vendor' as const,
    })),
    { key: 'all', label: t('nav.searchAll', { query: term }), to: `/shop?search=${encodeURIComponent(term)}`, kind: 'all' as const },
  ]

  const go = (to: string) => {
    setOpen(false)
    setQuery('')
    setActive(-1)
    navigate(to)
    onNavigate?.()
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (active >= 0 && options[active]) go(options[active].to)
    else if (term) go(`/shop?search=${encodeURIComponent(term)}`)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive(i => Math.min(i + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(i => Math.max(i - 1, -1))
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const showList = open && options.length > 0
  const firstVendor = options.findIndex(o => o.kind === 'vendor')
  const hasProducts = options[0]?.kind === 'product'

  return (
    <form role="search" onSubmit={onSubmit} className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-fg-subtle" />
      <input
        type="search"
        role="combobox"
        aria-label={t('nav.search')}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoFocus={autoFocus}
        value={query}
        placeholder={t('nav.searchPlaceholder')}
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1) }}
        onFocus={() => { clearTimeout(blurTimer.current); setOpen(true) }}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
        onKeyDown={onKeyDown}
        className="h-11 w-full rounded-full border border-border bg-surface-muted ps-10 pe-4 text-base text-fg placeholder:text-fg-subtle transition-colors focus-visible:border-primary focus-visible:bg-surface focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/40 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg animate-scale-in">
          {results && options.length === 1 && (
            <li role="presentation" className="px-2.5 py-2 text-sm text-fg-muted">{t('nav.searchEmpty', { query: term })}</li>
          )}
          {options.map((option, index) => (
            <li key={option.key} className="contents">
              {index === 0 && hasProducts && <p className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-fg-subtle">{t('nav.searchProducts')}</p>}
              {index === firstVendor && <p className="px-2.5 pb-1 pt-2 text-xs font-semibold text-fg-subtle">{t('nav.searchStores')}</p>}
              <div
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={event => event.preventDefault()}
                onClick={() => go(option.to)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm',
                  index === active && 'bg-surface-muted',
                  option.kind === 'all' && 'mt-1 border-t border-border pt-2.5 font-medium text-primary',
                )}
              >
                {option.kind !== 'all' && (
                  <span className={cn('flex size-9 shrink-0 items-center justify-center overflow-hidden bg-surface-sunken text-fg-subtle', option.kind === 'vendor' ? 'rounded-full' : 'rounded-md')}>
                    {option.image ? <img src={option.image} alt="" className="size-full object-cover" /> : option.kind === 'vendor' ? <Store className="size-4" /> : <Search className="size-4" />}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.meta && <bdi className="text-xs font-semibold tabular-nums text-fg-muted">{option.meta}</bdi>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
