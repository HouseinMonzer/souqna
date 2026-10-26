import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ImageOff, ShoppingBag, Trash2 } from 'lucide-react'
import { Avatar, Breadcrumbs, Button, EmptyState, IconButton, PriceTag, QuantityStepper, formatPrice } from '../components/ui'
import { Container } from '../components/layout/Container'
import { useCartStore } from '../store/cartStore'
import { usePageTitle } from '../hooks/usePageTitle'

export default function CartPage() {
  const { t } = useTranslation()
  usePageTitle(t('cart.title'))
  const vendorCarts = useCartStore(s => s.vendorCarts)
  const updateQty = useCartStore(s => s.updateQty)
  const removeItem = useCartStore(s => s.removeItem)
  const count = useCartStore(s => s.itemCount())

  if (!vendorCarts.length) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ShoppingBag />}
          title={t('cart.empty')}
          message={t('cart.emptyText')}
          action={<Button asChild><Link to="/shop">{t('cart.startShopping')}</Link></Button>}
        />
      </Container>
    )
  }

  return (
    <Container className="grid gap-6 py-6 sm:py-8">
      <Breadcrumbs items={[{ label: t('product.home'), to: '/' }, { label: t('cart.title') }]} />
      <div className="grid gap-1">
        <h1 className="text-3xl font-semibold">{t('cart.title')}</h1>
        <p className="text-sm text-fg-muted">{t('cart.items', { count })} · {t('cart.perVendor')}</p>
      </div>

      <div className="grid gap-6">
        {vendorCarts.map(cart => {
          const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
          return (
            <section key={cart.vendorId} aria-labelledby={`vendor-${cart.vendorId}`} className="overflow-hidden rounded-lg border border-border bg-surface">
              <header className="flex items-center gap-3 border-b border-border bg-surface-muted px-4 py-3">
                <Avatar name={cart.vendorName} src={cart.vendorLogo} size="sm" shape="square" />
                <h2 id={`vendor-${cart.vendorId}`} className="font-sans text-base font-semibold">
                  {cart.vendorSlug ? <Link to={`/vendors/${cart.vendorSlug}`} className="hover:underline">{cart.vendorName}</Link> : cart.vendorName}
                </h2>
              </header>
              <ul className="divide-y divide-border">
                {cart.items.map(item => (
                  <li key={`${item.product_id}-${item.variant_id}`} className="flex gap-3 p-4 sm:gap-4">
                    <Link to={`/product/${item.product.slug}`} className="size-20 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:size-24">
                      {item.product.primary_image
                        ? <img src={item.product.primary_image} alt="" className="size-full object-cover" />
                        : <span className="flex size-full items-center justify-center text-fg-subtle"><ImageOff className="size-6" /></span>}
                    </Link>
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div className="grid min-w-0 gap-1">
                        <Link to={`/product/${item.product.slug}`} className="line-clamp-2 font-semibold hover:underline">{item.product.name}</Link>
                        {item.variant && <p className="text-sm text-fg-muted">{item.variant.option_name}: {item.variant.option_value}</p>}
                        <PriceTag price={item.product.price} size="sm" showDiscount={false} />
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <QuantityStepper size="sm" value={item.quantity} max={99} onChange={qty => updateQty(item.product_id, qty, item.variant_id)} />
                        <IconButton label={t('cart.remove', { name: item.product.name })} icon={<Trash2 />} size="icon-sm" onClick={() => removeItem(item.product_id, item.variant_id)} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4">
                <div className="grid">
                  <span className="text-sm text-fg-muted">{t('cart.subtotal')}</span>
                  <bdi className="text-xl font-bold tabular-nums">{formatPrice(subtotal)}</bdi>
                </div>
                <Button asChild variant="accent" size="lg"><Link to={`/checkout/${cart.vendorId}`}>{t('cart.checkout')}</Link></Button>
              </footer>
            </section>
          )
        })}
      </div>
      <Button asChild variant="link" className="justify-self-start"><Link to="/shop">{t('cart.continue')}</Link></Button>
    </Container>
  )
}
