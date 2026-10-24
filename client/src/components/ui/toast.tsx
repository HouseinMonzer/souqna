import { useSyncExternalStore, type ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

type Tone = 'neutral' | 'success' | 'danger'

export interface ToastOptions {
  title: ReactNode
  description?: ReactNode
  tone?: Tone
  duration?: number
  action?: { label: string; onClick: () => void }
}

interface ToastEntry extends ToastOptions {
  id: number
  open: boolean
}

// A tiny module-level store so toast() can be called from anywhere, including
// outside React (API helpers, stores).
let entries: ToastEntry[] = []
const listeners = new Set<() => void>()
let nextId = 1

const emit = () => listeners.forEach(listener => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function toast(options: ToastOptions) {
  const id = nextId++
  entries = [...entries.slice(-2), { ...options, id, open: true }]
  emit()
  return id
}

function dismiss(id: number) {
  entries = entries.map(entry => (entry.id === id ? { ...entry, open: false } : entry))
  emit()
  setTimeout(() => {
    entries = entries.filter(entry => entry.id !== id)
    emit()
  }, 300)
}

/** Compatible with the original `useToast().show(message)` API. */
export function useToast() {
  return {
    toast,
    show: (message: string, duration = 3000) => toast({ title: message, duration }),
  }
}

const ICONS = { neutral: Info, success: CheckCircle2, danger: XCircle }
const ICON_COLORS = { neutral: 'text-bg/70', success: 'text-brand-300', danger: 'text-danger-50' }

export function Toaster() {
  const { t } = useTranslation()
  const items = useSyncExternalStore(subscribe, () => entries, () => entries)
  return (
    <ToastPrimitive.Provider swipeDirection="down" label={t('ui.notifications')}>
      {items.map(({ id, open, title, description, tone = 'neutral', duration = 4000, action }) => {
        const Icon = ICONS[tone]
        return (
          <ToastPrimitive.Root
            key={id}
            open={open}
            duration={duration}
            onOpenChange={next => !next && dismiss(id)}
            className={cn(
              'pointer-events-auto flex w-full items-start gap-3 rounded-lg p-4 shadow-lg data-[state=open]:animate-slide-up',
              'data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y) data-[swipe=end]:animate-fade-in',
              tone === 'danger' ? 'bg-danger text-white dark:bg-danger-soft dark:text-danger' : 'bg-fg text-bg',
            )}
          >
            <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', ICON_COLORS[tone])} />
            <div className="grid flex-1 gap-0.5">
              <ToastPrimitive.Title className="text-sm font-semibold">{title}</ToastPrimitive.Title>
              {description && <ToastPrimitive.Description className="text-sm opacity-85">{description}</ToastPrimitive.Description>}
            </div>
            {action && (
              <ToastPrimitive.Action altText={action.label} onClick={action.onClick} className="shrink-0 text-sm font-semibold underline underline-offset-2">
                {action.label}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close aria-label={t('ui.close')} className="-me-1 -mt-1 shrink-0 rounded-sm p-1 opacity-70 hover:opacity-100">
              <X className="size-4" aria-hidden />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
      <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] mx-auto flex w-full max-w-md flex-col gap-2 p-4 sm:end-0 sm:start-auto sm:mx-0 sm:pb-6" />
    </ToastPrimitive.Provider>
  )
}

/** @deprecated use <Toaster /> */
export const ToastProvider = Toaster
