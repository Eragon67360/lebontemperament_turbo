import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/** A collapsed secondary block of « Partitions et documents » (settings, old files). */
export function Disclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="group border-border bg-card rounded-lg border shadow-sm">
      <summary className="hover:bg-accent flex min-h-(--row-h) cursor-pointer list-none items-center gap-2 rounded-lg px-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="text-primary-text size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden
        />
        {label}
      </summary>
      <div className="border-border border-t p-4">{children}</div>
    </details>
  );
}
