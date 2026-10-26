import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '../ui'
import { Logo } from '../layout/Logo'
import { toggleLanguage } from '../../lib/i18n'

/** Split-screen frame for sign-in flows: brand story on one side, the form on the other. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-fg lg:flex lg:flex-col">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:repeating-conic-gradient(currentColor_0_25%,transparent_0_50%)] [background-size:32px_32px]" />
        <Logo className="relative text-3xl [&>span:first-child]:text-primary-fg" />
        <figure className="relative mt-auto grid max-w-md gap-4">
          <blockquote className="font-display text-2xl leading-snug">{t('auth.panelQuote')}</blockquote>
          <figcaption className="text-sm opacity-80">{t('auth.panelAuthor')}</figcaption>
        </figure>
      </aside>
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <Button variant="ghost" size="sm" startIcon={<Languages />} onClick={toggleLanguage}>{t('nav.language')}</Button>
        </div>
        <div className="mx-auto grid w-full max-w-sm flex-1 content-center gap-6 py-10">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle && <p className="text-fg-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
