import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-base text-foreground transition-[border-color,box-shadow] motion-reduce:transition-none placeholder:text-foreground-faint hover:border-foreground-faint focus-visible:border-ring focus-visible:outline-offset-0 aria-invalid:border-danger aria-invalid:ring-[3px] aria-invalid:ring-danger-soft disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
