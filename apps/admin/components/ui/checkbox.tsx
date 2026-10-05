"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 20 px box; wrap it in a 44 px label or cell for the touch target. Supports
 * `checked="indeterminate"` (a minus) for "select all" headers.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer grid size-5 shrink-0 cursor-pointer place-content-center rounded-[5px] border-[1.5px] border-input bg-card text-primary-foreground transition-[background-color,border-color] motion-reduce:transition-none hover:border-foreground-faint disabled:cursor-not-allowed disabled:opacity-55 data-[state=checked]:border-primary-strong data-[state=checked]:bg-primary-strong data-[state=indeterminate]:border-primary-strong data-[state=indeterminate]:bg-primary-strong aria-invalid:border-danger",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
      {props.checked === "indeterminate" ? (
        <Minus className="size-3.5" strokeWidth={3} />
      ) : (
        <Check className="size-3.5" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
