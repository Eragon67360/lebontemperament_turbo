import { cn } from "@/lib/utils";
import { dateBlockParts } from "@/utils/dateBlock";

const SIZES = {
  sm: {
    root: "w-11 pr-3",
    day: "text-[20px] leading-6",
    month: "text-[11px] leading-4",
  },
  lg: {
    root: "min-w-18 pr-5",
    day: "text-[44px] leading-[48px] tracking-[-0.01em]",
    month: "text-[14px] leading-5",
  },
} as const;

/**
 * The programme-style date: the day large, the month abbreviated in small
 * capitals under it, and a 2 px rule on the right that separates it from
 * the text. `sm` for list rows, `lg` for a featured item (the home's
 * « Prochain concert »). The rule is `border-border-strong`, or the brand
 * teal with `tone="primary"` (concerts).
 *
 * Decorative (`aria-hidden`): the row or card says the date in words.
 */
export function DateBlock({
  date,
  size = "sm",
  tone = "neutral",
  className,
}: {
  date: Date;
  size?: "sm" | "lg";
  tone?: "neutral" | "primary";
  className?: string;
}) {
  const { day, month } = dateBlockParts(date);
  const s = SIZES[size];
  return (
    <span
      aria-hidden
      data-slot="date-block"
      className={cn(
        "flex shrink-0 flex-col items-center justify-center border-r-2 text-center",
        tone === "primary" ? "border-primary" : "border-border-strong",
        s.root,
        className,
      )}
    >
      <span
        className={cn("text-foreground font-semibold tabular-nums", s.day)}
      >
        {day}
      </span>
      <span
        className={cn(
          "text-muted-foreground font-semibold tracking-[0.1em] uppercase",
          s.month,
        )}
      >
        {month}
      </span>
    </span>
  );
}
