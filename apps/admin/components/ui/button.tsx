import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * One filled teal button per screen (`default`); everything else is outlined
 * or text. Destructive actions are `destructive-outline` on the page and
 * `destructive` (filled) only as the confirm button of a dialog. Heights
 * follow the density variables: 44 px comfortable, 40 px compact.
 * Focus comes from the global `:focus-visible` ring.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-[15px] leading-5 font-medium transition-[color,background-color,border-color,box-shadow] motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-strong text-primary-foreground hover:bg-primary-strong-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        "destructive-outline":
          "border-danger bg-card text-danger-foreground hover:bg-danger-soft",
        outline: "border-input bg-card text-foreground hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-border-strong/40",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-(--control-h) px-4",
        sm: "h-10 px-3 text-sm pointer-coarse:h-11",
        lg: "h-12 px-6",
        icon: "size-(--control-h)",
        "icon-sm": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
