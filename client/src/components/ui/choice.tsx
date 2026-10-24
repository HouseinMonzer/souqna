import { forwardRef, useId, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as RadioPrimitive from '@radix-ui/react-radio-group'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Check, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

const boxBase = [
  'peer shrink-0 border border-border-strong bg-surface transition-colors duration-(--duration-fast)',
  'hover:border-primary disabled:cursor-not-allowed disabled:opacity-50',
  'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg',
  'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-fg',
].join(' ')

function ChoiceLabel({ id, label, description }: { id: string; label?: ReactNode; description?: ReactNode }) {
  if (!label) return null
  return (
    <span className="grid gap-0.5">
      <label htmlFor={id} className="cursor-pointer text-sm font-medium leading-5 text-fg peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
        {label}
      </label>
      {description && <span className="text-xs text-fg-muted">{description}</span>}
    </span>
  )
}

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: ReactNode
  description?: ReactNode
}

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(function Checkbox(
  { className, label, description, id, ...props },
  ref,
) {
  const generated = useId()
  const controlId = id ?? generated
  return (
    <span className="inline-flex items-start gap-2.5">
      <CheckboxPrimitive.Root ref={ref} id={controlId} className={cn(boxBase, 'mt-0.5 size-5 rounded-sm', className)} {...props}>
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          {props.checked === 'indeterminate' ? <Minus className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <ChoiceLabel id={controlId} label={label} description={description} />
    </span>
  )
})

export const RadioGroup = forwardRef<ElementRef<typeof RadioPrimitive.Root>, ComponentPropsWithoutRef<typeof RadioPrimitive.Root>>(
  function RadioGroup({ className, ...props }, ref) {
    return <RadioPrimitive.Root ref={ref} className={cn('grid gap-3', className)} {...props} />
  },
)

export interface RadioItemProps extends ComponentPropsWithoutRef<typeof RadioPrimitive.Item> {
  label?: ReactNode
  description?: ReactNode
}

export const RadioItem = forwardRef<ElementRef<typeof RadioPrimitive.Item>, RadioItemProps>(function RadioItem(
  { className, label, description, id, ...props },
  ref,
) {
  const generated = useId()
  const controlId = id ?? generated
  return (
    <span className="inline-flex items-start gap-2.5">
      <RadioPrimitive.Item
        ref={ref}
        id={controlId}
        className={cn(boxBase, 'mt-0.5 size-5 rounded-full data-[state=checked]:bg-surface', className)}
        {...props}
      >
        <RadioPrimitive.Indicator className="flex items-center justify-center after:block after:size-2.5 after:rounded-full after:bg-primary" />
      </RadioPrimitive.Item>
      <ChoiceLabel id={controlId} label={label} description={description} />
    </span>
  )
})

export interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: ReactNode
  description?: ReactNode
}

export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(function Switch(
  { className, label, description, id, ...props },
  ref,
) {
  const generated = useId()
  const controlId = id ?? generated
  return (
    <span className="inline-flex items-start gap-3">
      <SwitchPrimitive.Root
        ref={ref}
        id={controlId}
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent bg-border-strong',
          'transition-colors duration-(--duration-fast) data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block size-5 rounded-full bg-white shadow-sm transition-transform duration-(--duration-base) ease-(--ease-standard)',
            'data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5',
          )}
        />
      </SwitchPrimitive.Root>
      <ChoiceLabel id={controlId} label={label} description={description} />
    </span>
  )
})
