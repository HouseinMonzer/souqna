import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { DialogOverlay } from './dialog'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

// `start`/`end` follow the reading direction: `start` is left in English and right in Arabic.
const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 bg-surface text-fg shadow-lg transition-transform duration-(--duration-slow) ease-(--ease-standard) data-[state=open]:animate-[var(--sheet-in)]',
  {
    variants: {
      side: {
        start: 'inset-y-0 start-0 h-dvh w-[min(22rem,88vw)] border-e border-border [--sheet-in:sheet-from-start_var(--duration-slow)_var(--ease-standard)] rtl:[--sheet-in:sheet-from-end_var(--duration-slow)_var(--ease-standard)]',
        end: 'inset-y-0 end-0 h-dvh w-[min(24rem,92vw)] border-s border-border [--sheet-in:sheet-from-end_var(--duration-slow)_var(--ease-standard)] rtl:[--sheet-in:sheet-from-start_var(--duration-slow)_var(--ease-standard)]',
        bottom: 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-t border-border pb-[env(safe-area-inset-bottom)] [--sheet-in:sheet-from-bottom_var(--duration-slow)_var(--ease-standard)]',
      },
    },
    defaultVariants: { side: 'end' },
  },
)

export interface SheetContentProps extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  title: ReactNode
  description?: ReactNode
  side?: 'start' | 'end' | 'bottom'
  footer?: ReactNode
}

export const SheetContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(function SheetContent(
  { className, title, description, side = 'end', footer, children, ...props },
  ref,
) {
  const { t } = useTranslation()
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        {side === 'bottom' && <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border-strong/60" />}
        <div className={cn('flex items-start justify-between gap-4 px-5', side === 'bottom' ? 'pt-1' : 'pt-5')}>
          <div className="grid gap-1">
            <DialogPrimitive.Title className="font-display text-lg font-semibold">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="text-sm text-fg-muted">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close
            aria-label={t('ui.close')}
            className="-me-2 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
        {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

/** A bottom sheet — the mobile-friendly alternative to a dialog. */
export const Drawer = Sheet
export const DrawerTrigger = SheetTrigger
export const DrawerClose = SheetClose
export const DrawerContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, Omit<SheetContentProps, 'side'>>(
  function DrawerContent(props, ref) {
    return <SheetContent ref={ref} side="bottom" {...props} />
  },
)
