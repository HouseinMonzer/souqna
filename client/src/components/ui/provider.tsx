import type { ReactNode } from 'react'
import { DirectionProvider } from '@radix-ui/react-direction'
import { useDirection } from '../../hooks/useDirection'
import { TooltipProvider } from './tooltip'
import { Toaster } from './toast'

/** App-wide context for the UI kit: reading direction, tooltips and toasts. */
export function UIProvider({ children }: { children: ReactNode }) {
  const dir = useDirection()
  return (
    <DirectionProvider dir={dir}>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster />
      </TooltipProvider>
    </DirectionProvider>
  )
}
