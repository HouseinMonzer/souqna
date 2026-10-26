import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} aria-label="SouQna" className={cn('inline-flex items-baseline font-display text-2xl font-semibold tracking-tight', className)} dir="ltr">
      <span className="text-fg">Souq</span>
      <span className="text-accent">na</span>
    </Link>
  )
}
