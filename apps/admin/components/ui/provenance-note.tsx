import { cn } from "@/lib/utils";
import { FileSpreadsheet, type LucideIcon } from "lucide-react";
import * as React from "react";

export interface ProvenanceNoteProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: LucideIcon;
}

/**
 * Where a value comes from, under the value itself: « Mis à jour depuis la
 * liste des membres le 2 septembre · lecture seule ici ». Note-sized, muted,
 * with a small icon for the source.
 */
export function ProvenanceNote({
  icon: Icon = FileSpreadsheet,
  className,
  children,
  ...props
}: ProvenanceNoteProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-note text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </span>
  );
}
