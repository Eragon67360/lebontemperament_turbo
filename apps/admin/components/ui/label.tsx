"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-[15px] leading-[22px] font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

/** « * » after a required field's label, announced as « (obligatoire) ». */
function RequiredMark() {
  return (
    <>
      <span aria-hidden className="ml-0.5 font-semibold text-danger-foreground">
        *
      </span>
      <span className="sr-only"> (obligatoire)</span>
    </>
  );
}

/** « (facultatif) » after an optional field's label. */
function OptionalMark() {
  return (
    <span className="ml-1.5 text-sm font-normal text-muted-foreground">
      (facultatif)
    </span>
  );
}

export { Label, OptionalMark, RequiredMark };
