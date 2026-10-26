import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, isRtlElement } from '../../lib/utils'

export interface GalleryImage {
  src: string
  alt: string
}

export interface ImageGalleryProps {
  images: GalleryImage[]
  className?: string
}

const SWIPE_THRESHOLD = 40

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const startX = useRef<number | null>(null)
  const count = images.length

  if (!count) {
    return (
      <div className={cn('flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg bg-surface-muted text-fg-subtle', className)}>
        <ImageOff aria-hidden className="size-10" />
        <span className="text-sm">{t('ui.noImage')}</span>
      </div>
    )
  }

  const go = (next: number) => setIndex((next + count) % count)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = isRtlElement(event.currentTarget)
    if (event.key === 'ArrowRight') go(index + (rtl ? -1 : 1))
    else if (event.key === 'ArrowLeft') go(index + (rtl ? 1 : -1))
    else if (event.key === 'Home') go(0)
    else if (event.key === 'End') go(count - 1)
    else return
    event.preventDefault()
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return
    const delta = event.clientX - startX.current
    startX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    // Swiping towards the reading start shows the next image.
    const towardsStart = isRtlElement(event.currentTarget) ? delta > 0 : delta < 0
    go(index + (towardsStart ? 1 : -1))
  }

  const current = images[index]
  const arrow = 'absolute top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full bg-surface/90 text-fg shadow-md backdrop-blur transition-opacity hover:bg-surface sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={current.alt}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={event => { startX.current = event.clientX }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { startX.current = null }}
        className="group relative aspect-square w-full touch-pan-y overflow-hidden rounded-lg bg-surface-muted select-none"
      >
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          draggable={false}
          className="size-full object-cover animate-fade-in"
        />
        {count > 1 && (
          <>
            <button type="button" className={cn(arrow, 'start-3')} onClick={() => go(index - 1)} aria-label={t('ui.previousImage')}>
              <ChevronLeft aria-hidden className="size-5 rtl:rotate-180" />
            </button>
            <button type="button" className={cn(arrow, 'end-3')} onClick={() => go(index + 1)} aria-label={t('ui.nextImage')}>
              <ChevronRight aria-hidden className="size-5 rtl:rotate-180" />
            </button>
            <span aria-live="polite" className="absolute bottom-3 end-3 rounded-full bg-fg/75 px-2.5 py-1 text-xs font-medium text-bg tabular-nums">
              {t('ui.image', { index: index + 1, total: count })}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('ui.showImage', { index: i + 1 })}
              aria-current={i === index || undefined}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-md border-2 transition-[border-color,opacity] sm:size-20',
                i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <img src={image.src} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
