import type { CSSProperties } from 'react'
import { cn } from '../../lib/utils'

export interface SkeletonProps {
  className?: string
  /** Legacy sizing props; prefer className. */
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: CSSProperties
}

export function Skeleton({ className, width, height, borderRadius, style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'rounded-md bg-[linear-gradient(90deg,var(--surface-sunken)_25%,var(--surface-muted)_50%,var(--surface-sunken)_75%)] bg-size-[200%_100%] animate-shimmer',
        !height && !className?.match(/\bh-/) && 'h-5',
        className,
      )}
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface" aria-hidden>
      <Skeleton className="aspect-square h-auto w-full rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}
