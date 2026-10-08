import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "demo:inline-flex demo:shrink-0 demo:items-center demo:justify-center demo:gap-2 demo:rounded-md demo:text-sm demo:font-medium demo:whitespace-nowrap demo:transition-all demo:outline-none demo:focus-visible:border-ring demo:focus-visible:ring-[3px] demo:focus-visible:ring-ring/50 demo:disabled:pointer-events-none demo:disabled:opacity-50 demo:[&_svg]:pointer-events-none demo:[&_svg]:shrink-0 demo:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'demo:bg-primary demo:text-primary-foreground demo:shadow-xs demo:hover:bg-primary/90',
        destructive: 'demo:bg-destructive demo:text-white demo:shadow-xs demo:hover:bg-destructive/90',
        outline: 'demo:border demo:bg-background demo:shadow-xs demo:hover:bg-accent demo:hover:text-accent-foreground',
        secondary: 'demo:bg-secondary demo:text-secondary-foreground demo:shadow-xs demo:hover:bg-secondary/80',
        ghost: 'demo:hover:bg-accent demo:hover:text-accent-foreground',
        link: 'demo:text-primary demo:underline-offset-4 demo:hover:underline',
      },
      size: {
        default: 'demo:h-9 demo:px-4 demo:py-2 demo:has-[>svg]:px-3',
        sm: 'demo:h-8 demo:gap-1.5 demo:rounded-md demo:px-3 demo:has-[>svg]:px-2.5',
        lg: 'demo:h-10 demo:rounded-md demo:px-6 demo:has-[>svg]:px-4',
        icon: 'demo:size-9',
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
