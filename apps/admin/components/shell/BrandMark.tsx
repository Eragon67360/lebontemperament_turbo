import { cn } from "@/lib/utils";

/**
 * The admin's brand mark: the tuning fork of « Le Diapason », the members
 * app's icon, as a white stroke on a 36 px `primary-strong` tile (white on
 * it: 6.15:1, the same in both themes). Used by the sidebar's brand row and
 * the sign-in, not-found and access pages.
 *
 * Decorative: « Le Bon Tempérament » is always written next to it, so the
 * mark is hidden from assistive technology.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-primary-strong text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        focusable="false"
        className="size-5"
      >
        <path d="M9 3v7a3 3 0 0 0 6 0V3" />
        <path d="M12 13v8" />
      </svg>
    </span>
  );
}
