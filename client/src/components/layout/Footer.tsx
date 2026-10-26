import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Banknote, Smartphone, Wallet } from 'lucide-react'
import { Container } from './Container'
import { Logo } from './Logo'

export function Footer() {
  const { t } = useTranslation()
  const columns = [
    {
      title: t('footer.marketplace'),
      links: [
        { label: t('footer.shop'), to: '/shop' },
        { label: t('footer.newArrivals'), to: '/shop?sort=newest' },
        { label: t('footer.deals'), to: '/shop?sort=popular' },
      ],
    },
    {
      title: t('footer.vendorsCol'),
      links: [
        { label: t('footer.sell'), to: '/register' },
        { label: t('footer.dashboard'), to: '/dashboard' },
        { label: t('footer.browse'), to: '/vendors' },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.about'), to: '/about' },
        { label: t('footer.contact'), to: '/contact' },
        { label: t('footer.privacy'), to: '/privacy' },
        { label: t('footer.terms'), to: '/terms' },
      ],
    },
  ]
  const payments = [
    { icon: Banknote, label: t('footer.cash') },
    { icon: Wallet, label: t('footer.wish') },
    { icon: Smartphone, label: t('footer.omt') },
  ]

  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="grid content-start gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-fg-muted">{t('footer.tagline')}</p>
          <div className="grid gap-2">
            <span className="text-xs font-semibold text-fg-subtle">{t('footer.payments')}</span>
            <ul className="flex flex-wrap gap-2">
              {payments.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-muted">
                  <Icon aria-hidden className="size-3.5" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {columns.map(column => (
          <nav key={column.title} aria-label={column.title} className="grid content-start gap-3">
            <h2 className="font-sans text-sm font-semibold text-fg">{column.title}</h2>
            <ul className="grid gap-2">
              {column.links.map(link => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="text-sm text-fg-muted transition-colors hover:text-fg">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-fg-subtle">
          <span>{t('footer.rights')}</span>
        </Container>
      </div>
    </footer>
  )
}
