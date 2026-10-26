import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui'
import { Container } from '../components/layout/Container'
import { SearchBox } from '../components/layout/SearchBox'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFoundPage() {
  const { t } = useTranslation()
  usePageTitle(t('notFound.title'))
  return (
    <Container className="grid min-h-[60vh] place-items-center py-16">
      <div className="grid max-w-lg justify-items-center gap-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg">
          <Compass aria-hidden className="size-8" />
        </span>
        <p className="text-sm font-semibold text-accent">{t('notFound.code')}</p>
        <h1 className="text-4xl font-semibold">{t('notFound.title')}</h1>
        <p className="text-fg-muted">{t('notFound.message')}</p>
        <SearchBox className="w-full" />
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/">{t('notFound.home')}</Link></Button>
          <Button asChild variant="outline"><Link to="/shop">{t('notFound.shop')}</Link></Button>
        </div>
      </div>
    </Container>
  )
}
