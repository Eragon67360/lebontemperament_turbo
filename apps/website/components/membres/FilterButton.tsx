/**
 * A toggle pill for a filter group (`aria-pressed`): solid ink when chosen,
 * outlined otherwise. Wrap a group of them in a
 * `<fieldset>` with a `<legend>`.
 */
export function FilterButton({
  label,
  count,
  pressed,
  onPress,
}: {
  label: string;
  /** How many items the filter matches, shown in a small badge. */
  count?: number;
  pressed: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={`inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 px-4.5 text-lg font-medium transition-colors ${
        pressed
          ? "bg-members-ink text-members-ink-foreground border-members-ink"
          : "bg-members-card text-foreground border-members-line-strong hover:bg-members-band"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`rounded-full px-2 text-[15px] ${
            pressed
              ? "bg-members-ink-foreground/20"
              : "bg-members-band text-members-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
