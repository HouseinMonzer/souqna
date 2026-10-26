import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '../../lib/utils'

export const DropdownMenu = MenuPrimitive.Root
export const DropdownMenuTrigger = MenuPrimitive.Trigger
export const DropdownMenuGroup = MenuPrimitive.Group

export const DropdownMenuContent = forwardRef<ElementRef<typeof MenuPrimitive.Content>, ComponentPropsWithoutRef<typeof MenuPrimitive.Content>>(
  function DropdownMenuContent({ className, sideOffset = 6, align = 'end', ...props }, ref) {
    return (
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          align={align}
          className={cn(
            'z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-surface p-1 text-fg shadow-lg',
            'data-[state=open]:animate-scale-in origin-(--radix-dropdown-menu-content-transform-origin)',
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Portal>
    )
  },
)

export interface DropdownMenuItemProps extends ComponentPropsWithoutRef<typeof MenuPrimitive.Item> {
  icon?: ReactNode
  destructive?: boolean
}

export const DropdownMenuItem = forwardRef<ElementRef<typeof MenuPrimitive.Item>, DropdownMenuItemProps>(function DropdownMenuItem(
  { className, icon, destructive, children, ...props },
  ref,
) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none',
        'data-highlighted:bg-surface-muted data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&_svg]:size-4 [&_svg]:text-fg-subtle',
        destructive && 'text-danger [&_svg]:text-danger',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </MenuPrimitive.Item>
  )
})

export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithoutRef<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn('px-2.5 py-1.5 text-xs font-semibold text-fg-subtle', className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}
