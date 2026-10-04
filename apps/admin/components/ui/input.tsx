import * as React from "react";

import { cn } from "@/lib/utils";

/** Same geometry as Textarea and SelectTrigger: control height, radius 10, strong border. */
const inputClassName =
  "flex h-(--control-h) w-full min-w-0 rounded-md border border-input bg-card px-3.5 py-1 text-base text-foreground transition-[border-color,box-shadow] motion-reduce:transition-none placeholder:text-foreground-faint hover:border-foreground-faint focus-visible:border-ring focus-visible:outline-offset-0 aria-invalid:border-danger aria-invalid:ring-[3px] aria-invalid:ring-danger-soft disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputClassName, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputClassName };
