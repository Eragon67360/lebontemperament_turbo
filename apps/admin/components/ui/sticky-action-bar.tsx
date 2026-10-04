import { cn } from "@/lib/utils";
import * as React from "react";

export interface StickyActionBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Small reassurance next to the primary, e.g. « Rien n'est publié avant ce bouton. » */
  note?: React.ReactNode;
  /** Secondary action on the left (usually « Annuler »). */
  secondary?: React.ReactNode;
}

/**
 * Sticks to the bottom of its scroll container so the primary action never
 * scrolls away. Children go on the right (the primary last); `secondary` on
 * the left. Respects the phone's home-indicator safe area.
 */
export const StickyActionBar = React.forwardRef<
  HTMLDivElement,
  StickyActionBarProps
>(({ note, secondary, children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "sticky bottom-0 z-20 border-t border-border bg-background/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-6",
      className,
    )}
    {...props}
  >
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 self-start sm:self-auto">
        {secondary}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {note && (
          <p className="text-note text-muted-foreground max-sm:hidden">
            {note}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center [&>*]:max-sm:w-full">
          {children}
        </div>
      </div>
    </div>
  </div>
));
StickyActionBar.displayName = "StickyActionBar";
