
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        crypto: "border-transparent bg-crypto-blue text-white hover:bg-crypto-blue/90",
        success: "border-transparent bg-crypto-green text-white hover:bg-crypto-green/90",
        warning: "border-transparent bg-amber-500 text-white hover:bg-amber-500/90",
        danger: "border-transparent bg-crypto-red text-white hover:bg-crypto-red/90",
        ghost: "border-transparent bg-secondary/50 text-foreground hover:bg-secondary",
        glass: "border-white/20 bg-white/10 backdrop-blur-md text-foreground hover:bg-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
