import { useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const avatarVariants = cva('relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary-soft font-semibold text-primary-soft-fg select-none', {
  variants: {
    size: { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' },
    shape: { circle: 'rounded-full', square: 'rounded-md' },
  },
  defaultVariants: { size: 'md', shape: 'circle' },
})

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string | null
  name: string
  className?: string
}

// First letter of the first two words; symbols such as "&" are skipped.
const initials = (name: string) =>
  name.trim().split(/\s+/).filter(part => /\p{L}|\p{N}/u.test(part)).slice(0, 2)
    .map(part => [...part].find(ch => /\p{L}|\p{N}/u.test(ch)) ?? '').join('').toUpperCase() || '?'

export function Avatar({ src, name, size, shape, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = src && failedSrc !== src
  return (
    <span className={cn(avatarVariants({ size, shape }), className)}>
      {showImage ? (
        <img src={src} alt={name} loading="lazy" className="size-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        <span role="img" aria-label={name}>{initials(name)}</span>
      )}
    </span>
  )
}
