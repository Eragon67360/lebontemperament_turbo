// Turns react-hook-form's error map into the rows of `ErrorSummary`, in the
// order the fields appear on the form. Pure, unit-tested.
import type { ErrorSummaryItem } from "@/components/ui/error-summary";

export type FieldLabels<TName extends string = string> = Record<
  TName,
  { label: string; id: string }
>;

type ErrorLike = { message?: unknown } | undefined | null;

/**
 * One summary row per field in `labels` that has an error message; fields
 * without a label (hidden ones) are skipped. `labels` fixes the order.
 */
export function errorSummaryItems<TName extends string>(
  errors: Partial<Record<TName, ErrorLike>>,
  labels: FieldLabels<TName>,
): ErrorSummaryItem[] {
  const items: ErrorSummaryItem[] = [];
  for (const name of Object.keys(labels) as TName[]) {
    const error = errors[name];
    const message =
      error && typeof error.message === "string" ? error.message : "";
    if (!message) continue;
    items.push({
      fieldId: labels[name].id,
      label: labels[name].label,
      message,
    });
  }
  return items;
}
