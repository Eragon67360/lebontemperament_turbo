/**
 * A toggle button for a filter group (`aria-pressed`): solid teal with white
 * text when chosen, outlined otherwise. Wrap a group of them in a
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
      className={`inline-flex min-h-12 items-center gap-2.5 rounded-full border px-4.5 text-lg font-bold transition-colors ${
        pressed
          ? "bg-primary-solid text-accent-foreground border-primary-solid"
          : "bg-members-card text-foreground border-members-line-strong hover:bg-primary/10"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`rounded-full px-2 text-[15px] ${
            pressed ? "bg-white/20" : "bg-members-band text-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
