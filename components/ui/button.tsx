import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-action-primary text-white shadow-sm hover:bg-action-primary-hover active:bg-action-primary-active",
        destructive:
          "bg-action-danger text-white shadow-sm hover:bg-action-danger-hover",
        outline:
          "border border-border-default bg-white text-foreground shadow-xs hover:bg-surface-sunken hover:text-foreground",
        secondary:
          "border border-border-default bg-white text-foreground shadow-xs hover:bg-surface-sunken",
        ghost: "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
        link: "text-action-primary underline-offset-4 hover:underline",
        // Marketing variants keep the public-site API while using v2 tokens.
        marketing: "bg-action-primary text-white shadow-sm hover:bg-action-primary-hover",
        "marketing-outline":
          "border border-border-default bg-white text-foreground hover:bg-surface-sunken",
        "marketing-ghost": "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
