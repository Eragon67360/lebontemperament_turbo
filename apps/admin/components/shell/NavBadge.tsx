import { cn } from "@/lib/utils";

/** Unread counter, the filled teal pill of direction B (`.count`). */
export function CountBadge({
  count,
  size = "md",
  className,
  srLabel = "non lus",
}: {
  count: number;
  /** `sm` sits on an avatar corner. */
  size?: "sm" | "md";
  className?: string;
  /** Read after the number: « 2 non lus ». */
  srLabel?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "bg-primary-strong text-primary-foreground inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
        size === "sm"
          ? "h-[18px] min-w-[18px] px-1 text-[11px]"
          : "h-[22px] min-w-[22px] px-[7px] text-xs",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> {srLabel}</span>
    </span>
  );
}

/** Something needs attention: a dot, named for screen readers. */
export function AttentionDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-danger inline-flex size-2 shrink-0 rounded-full",
        className,
      )}
    >
      <span className="sr-only">Éléments non lus</span>
    </span>
  );
}
