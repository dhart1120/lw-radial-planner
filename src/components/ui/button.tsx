import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // base styles applied to every button
  "inline-flex items-center justify-center cursor-pointer gap-2 whitespace-nowrap " +
    "rounded-xl text-base font-medium border border-transparent " +
    "transition-all disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 " +
    "outline-none focus-visible:ring-2 focus-visible:ring-ring " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "focus-visible:border-primary-foreground " +
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-light hover:border-primary-foreground shadow-sm hover:shadow-md active:shadow-sm active:translate-y-[1px]",

        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-sm hover:shadow-md active:shadow-sm active:translate-y-[1px] focus-visible:border-destructive",

        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground " +
          "dark:bg-input/30 dark:border-input dark:hover:bg-input/50",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md active:shadow-sm active:translate-y-[1px]",

        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",

        link:
          "text-primary underline-offset-4 hover:underline border-none shadow-none p-0 h-auto",

        "outline-primary":
          "border border-primary text-primary hover:bg-primary-light " +
          "hover:text-primary-foreground shadow-sm hover:shadow-md " +
          "active:shadow-sm active:translate-y-[1px] " +
          "focus-visible:border-primary-foreground",

        "outline-destructive":
          "border border-destructive text-destructive hover:bg-primary-light " +
          "hover:text-destructive-foreground shadow-sm hover:shadow-md " +
          "active:shadow-sm active:translate-y-[1px] " +
          "focus-visible:border-destructive-foreground",
      },
      size: {
        default: "h-10 px-6 has-[>svg]:px-5",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-sm",
        lg: "h-11 rounded-xl px-7 has-[>svg]:px-5 text-base",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "icon-xl": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
