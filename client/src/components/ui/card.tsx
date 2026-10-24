import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const cardVariants = cva('rounded-lg bg-surface text-fg', {
  variants: {
    variant: {
      outline: 'border border-border',
      elevated: 'shadow-md',
      muted: 'bg-surface-muted',
    },
    interactive: {
      true: 'transition-[box-shadow,transform,border-color] duration-(--duration-base) ease-(--ease-standard) hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg focus-within:shadow-lg motion-reduce:hover:translate-y-0',
    },
  },
  defaultVariants: { variant: 'outline' },
})

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ className, variant, interactive, ...props }, ref) {
  return <div ref={ref} className={cn(cardVariants({ variant, interactive }), className)} {...props} />
})

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-lg font-semibold leading-snug', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-fg-muted', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 border-t border-border px-5 py-4', className)} {...props} />
}
