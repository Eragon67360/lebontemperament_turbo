import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Chips. `default` is the filled teal counter; the semantic variants are soft
 * tints with a readable text colour, for statuses and meaning only.
 * `dot` adds a coloured dot so the state is not carried by colour alone
 * when the word is short.
 */
const badgeVariants = cva(
  "inline-flex min-h-7 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-note font-medium whitespace-nowrap transition-colors motion-reduce:transition-none [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-strong text-primary-foreground",
        secondary: "bg-muted text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border-input bg-transparent text-muted-foreground",
        accent: "bg-primary-soft text-primary-text",
        success: "bg-success-soft text-success-foreground",
        warning: "bg-warning-soft text-warning-foreground",
        danger: "bg-danger-soft text-danger-foreground",
        info: "bg-info-soft text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Leading status dot in the text colour. */
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
