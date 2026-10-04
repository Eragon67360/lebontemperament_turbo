"use client";

import { Callout } from "@/components/ui/callout";
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary";
import { errorSummaryItems, type FieldLabels } from "@/utils/formErrors";
import type { FieldErrors, FieldValues } from "react-hook-form";

/**
 * What a form says at its top: the summary of fields to fix (after a submit)
 * and, when the server refused the save, why, inline and announced.
 */
export function FormFeedback<T extends FieldValues>({
  errors,
  labels,
  submitCount,
  saveError,
}: {
  errors: FieldErrors<T>;
  labels: FieldLabels<Extract<keyof T, string>>;
  submitCount: number;
  saveError?: string | null;
}) {
  const items: ErrorSummaryItem[] =
    submitCount > 0
      ? errorSummaryItems(
          errors as Partial<
            Record<Extract<keyof T, string>, { message?: unknown }>
          >,
          labels,
        )
      : [];
  return (
    <>
      <ErrorSummary errors={items} />
      {saveError && (
        <Callout tone="danger" title="L'enregistrement a échoué" role="alert">
          <p>{saveError}</p>
          <p>Vérifiez votre connexion, puis réessayez.</p>
        </Callout>
      )}
    </>
  );
}

/** The message of a failed save, for the toast and the inline callout. */
export function saveErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Le serveur n'a pas répondu.";
}
