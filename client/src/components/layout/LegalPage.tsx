import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { Container } from './Container'
import { usePageTitle } from '../../hooks/usePageTitle'

export interface LegalSection { title: string; content: string }

/** Legal documents are maintained in English; Arabic readers see a notice. */
export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  const { i18n, t } = useTranslation()
  usePageTitle(title)
  const arabic = i18n.language?.startsWith('ar')
  return (
    <Container className="grid max-w-3xl gap-8 py-10">
      <h1 className="text-4xl font-semibold">{title}</h1>
      {arabic && (
        <p className="flex items-center gap-2 rounded-lg bg-info-soft px-4 py-3 text-sm text-info"><Info aria-hidden className="size-4 shrink-0" />{t('legal.englishOnly')}</p>
      )}
      <div dir="ltr" lang="en" className="grid gap-8 text-start">
        {sections.map(section => (
          <section key={section.title} className="grid gap-3">
            <h2 className="font-sans text-xl font-semibold">{section.title}</h2>
            <p className="whitespace-pre-line leading-relaxed text-fg-muted">{section.content}</p>
          </section>
        ))}
      </div>
    </Container>
  )
}
