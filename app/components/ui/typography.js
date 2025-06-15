import * as React from "react"
import { cn } from "../../../lib/utils"

const H1 = React.forwardRef(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-4xl md:text-5xl font-medium text-gray-900 tracking-tight",
      className
    )}
    {...props}
  />
))
H1.displayName = "H1"

const H2 = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-2xl md:text-3xl font-medium text-gray-900",
      className
    )}
    {...props}
  />
))
H2.displayName = "H2"

const H3 = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl md:text-2xl font-medium text-gray-900",
      className
    )}
    {...props}
  />
))
H3.displayName = "H3"

const H4 = React.forwardRef(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn(
      "text-lg font-medium text-gray-900",
      className
    )}
    {...props}
  />
))
H4.displayName = "H4"

const P = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-base text-gray-600 leading-relaxed",
      className
    )}
    {...props}
  />
))
P.displayName = "P"

const Lead = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-lg text-gray-600 leading-relaxed",
      className
    )}
    {...props}
  />
))
Lead.displayName = "Lead"

const Small = React.forwardRef(({ className, ...props }, ref) => (
  <small
    ref={ref}
    className={cn(
      "text-sm text-gray-500",
      className
    )}
    {...props}
  />
))
Small.displayName = "Small"

export { H1, H2, H3, H4, P, Lead, Small }
