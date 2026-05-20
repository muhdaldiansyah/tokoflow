import * as React from "react"
import { cn } from "../../../lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
    link: "text-gray-900 underline-offset-4 hover:underline",
    secondary: "bg-white text-gray-900 hover:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600"
  },
  size: {
    default: "px-4 py-2.5 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base",
    icon: "h-10 w-10 p-0",
  },
}

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button"
    
    const combinedClassName = cn(
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      className
    )
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
        children,
        {
          ref,
          className: cn(children.props.className, combinedClassName),
          ...props
        }
      )
    }
    
    return (
      <Comp
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button }
