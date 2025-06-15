import * as React from "react"
import { cn } from "../../../lib/utils"

const badgeVariants = {
  variant: {
    default: "bg-gray-900 text-white",
    secondary: "bg-gray-100 text-gray-900",
    outline: "border border-gray-200 text-gray-900",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  },
  size: {
    default: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  },
}

function Badge({ className, variant = "default", size = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        badgeVariants.variant[variant],
        badgeVariants.size[size],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
