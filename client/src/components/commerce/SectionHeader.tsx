import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function SectionHeader({ title, description, to, linkLabel }: { title: string; description?: string; to?: string; linkLabel?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="grid gap-1">
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        {description && <p className="text-fg-muted">{description}</p>}
      </div>
      {to && linkLabel && (
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4">
          {linkLabel}
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      )}
    </div>
  )
}
