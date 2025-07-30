import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md active:scale-95",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-105 transition-all duration-300 active:scale-95",
        premium: "bg-gradient-hero text-primary-foreground hover:shadow-glow hover:scale-105 transition-all duration-300 active:scale-95",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-md active:scale-95",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-md active:scale-95",
        subtle: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95",
        glass: "bg-background/20 backdrop-blur-sm border border-border/50 hover:bg-background/30 hover:shadow-lg active:scale-95",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs",
        sm: "h-8 rounded-md px-3 text-sm",
        default: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-base font-semibold",
        "2xl": "h-14 rounded-xl px-12 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
