import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, ShoppingBag, Store } from 'lucide-react'
import { Button } from '../components/ui'
import { Container } from '../components/layout/Container'
import { usePageTitle } from '../hooks/usePageTitle'

export default function AboutPage() {
  const { t } = useTranslation()
  usePageTitle(t('about.title'))
  const points = [
    { icon: ShoppingBag, title: t('about.howBuy'), text: t('about.howBuyText') },
    { icon: Store, title: t('about.howSell'), text: t('about.howSellText') },
    { icon: ShieldCheck, title: t('about.howTrust'), text: t('about.howTrustText') },
  ]
  return (
    <>
      <section className="border-b border-border bg-surface-muted">
        <Container className="grid max-w-3xl gap-5 py-14 sm:py-20">
          <p className="text-sm font-semibold text-accent">{t('about.eyebrow')}</p>
          <h1 className="text-4xl font-semibold text-balance sm:text-5xl">{t('about.heading')}</h1>
          <p className="text-lg text-fg-muted">{t('about.intro')}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" variant="accent"><Link to="/shop">{t('about.cta')}</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/register">{t('about.ctaSell')}</Link></Button>
          </div>
        </Container>
      </section>
      <Container className="grid gap-6 py-14 md:grid-cols-3">
        {points.map(({ icon: Icon, title, text }) => (
          <div key={title} className="grid content-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg"><Icon aria-hidden className="size-5" /></span>
            <h2 className="font-sans text-lg font-semibold">{title}</h2>
            <p className="text-fg-muted">{text}</p>
          </div>
        ))}
      </Container>
    </>
  )
}
