import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Inline notice. Semantic variants are soft tints with a coloured icon and
 * normal text, so they read in both themes. `destructive` stays as an alias
 * of `danger` for existing call sites.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-detail text-foreground [&>svg]:absolute [&>svg]:top-3.5 [&>svg]:left-4 [&>svg]:size-5 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-8",
  {
    variants: {
      variant: {
        default: "border-border bg-card [&>svg]:text-muted-foreground",
        info: "border-info/30 bg-info-soft [&>svg]:text-info",
        success: "border-success/30 bg-success-soft [&>svg]:text-success",
        warning: "border-warning/30 bg-warning-soft [&>svg]:text-warning",
        danger: "border-danger/30 bg-danger-soft [&>svg]:text-danger",
        destructive: "border-danger/30 bg-danger-soft [&>svg]:text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 text-base leading-6 font-semibold", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-detail [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
