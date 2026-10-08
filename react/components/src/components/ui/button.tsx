import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "ui:inline-flex ui:shrink-0 ui:items-center ui:justify-center ui:gap-2 ui:rounded-md ui:text-sm ui:font-medium ui:whitespace-nowrap ui:transition-all ui:outline-none ui:focus-visible:border-ring ui:focus-visible:ring-[3px] ui:focus-visible:ring-ring/50 ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:[&_svg]:pointer-events-none ui:[&_svg]:shrink-0 ui:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'ui:bg-primary ui:text-primary-foreground ui:shadow-xs ui:hover:bg-primary/90',
        destructive: 'ui:bg-destructive ui:text-white ui:shadow-xs ui:hover:bg-destructive/90',
        outline: 'ui:border ui:bg-background ui:shadow-xs ui:hover:bg-accent ui:hover:text-accent-foreground',
        secondary: 'ui:bg-secondary ui:text-secondary-foreground ui:shadow-xs ui:hover:bg-secondary/80',
        ghost: 'ui:hover:bg-accent ui:hover:text-accent-foreground',
        link: 'ui:text-primary ui:underline-offset-4 ui:hover:underline',
      },
      size: {
        default: 'ui:h-9 ui:px-4 ui:py-2 ui:has-[>svg]:px-3',
        sm: 'ui:h-8 ui:gap-1.5 ui:rounded-md ui:px-3 ui:has-[>svg]:px-2.5',
        lg: 'ui:h-10 ui:rounded-md ui:px-6 ui:has-[>svg]:px-4',
        icon: 'ui:size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
