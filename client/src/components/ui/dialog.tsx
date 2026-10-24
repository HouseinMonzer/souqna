import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogOverlay({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=open]:animate-fade-in', className)}
    />
  )
}

export interface DialogContentProps extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  /** Required: announced by screen readers when the dialog opens. */
  title: ReactNode
  description?: ReactNode
  hideClose?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export const DialogContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(function DialogContent(
  { className, title, description, hideClose, size = 'md', children, ...props },
  ref,
) {
  const { t } = useTranslation()
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={description ? undefined : props['aria-describedby']}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-y-1/2 gap-4 overflow-y-auto',
          '-translate-x-1/2 rounded-xl bg-surface p-6 text-fg shadow-lg data-[state=open]:animate-scale-in',
          SIZES[size],
          className,
        )}
        {...props}
      >
        <div className="grid gap-1.5 pe-8">
          <DialogPrimitive.Title className="font-display text-xl font-semibold">{title}</DialogPrimitive.Title>
          {description && <DialogPrimitive.Description className="text-sm text-fg-muted">{description}</DialogPrimitive.Description>}
        </div>
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            aria-label={t('ui.close')}
            className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}
