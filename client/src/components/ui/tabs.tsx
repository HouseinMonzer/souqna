import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

type TabsVariant = 'underline' | 'pills'
const VariantContext = createContext<TabsVariant>('underline')

export interface TabsProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant
}

export function Tabs({ variant = 'underline', ...props }: TabsProps) {
  return (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.Root {...props} />
    </VariantContext.Provider>
  )
}

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  function TabsList({ className, ...props }, ref) {
    const variant = useContext(VariantContext)
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          'flex max-w-full overflow-x-auto [scrollbar-width:none]',
          variant === 'underline' ? 'gap-6 border-b border-border' : 'inline-flex gap-1 rounded-lg bg-surface-muted p-1',
          className,
        )}
        {...props}
      />
    )
  },
)

export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  function TabsTrigger({ className, ...props }, ref) {
    const variant = useContext(VariantContext)
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          'inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-fg-muted transition-colors duration-(--duration-fast) hover:text-fg disabled:opacity-50',
          variant === 'underline'
            ? '-mb-px border-b-2 border-transparent pb-3 pt-1 data-[state=active]:border-primary data-[state=active]:text-fg'
            : 'rounded-md px-3.5 py-2 data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm',
          className,
        )}
        {...props}
      />
    )
  },
)

export const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  function TabsContent({ className, ...props }, ref) {
    return <TabsPrimitive.Content ref={ref} className={cn('pt-5 data-[state=active]:animate-fade-in', className)} {...props} />
  },
)
