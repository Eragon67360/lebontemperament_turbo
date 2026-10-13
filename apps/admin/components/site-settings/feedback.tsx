import { Callout } from "@/components/ui/callout";
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary";

/**
 * What a settings dialog says at the top of its form: the summary of inputs
 * to fix and, when the save itself failed (or the problem belongs to no
 * input), why. Both are announced when they appear.
 */
export function SettingFormFeedback({
  summary,
  problem,
}: {
  summary: ErrorSummaryItem[];
  problem: string | null;
}) {
  return (
    <>
      <ErrorSummary errors={summary} />
      {problem && (
        <Callout tone="danger" title="L'enregistrement a échoué" role="alert">
          <p>{problem}</p>
        </Callout>
      )}
    </>
  );
}

/** The message under an input; `id` is the one the input's `aria-describedby` names. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-detail text-danger-foreground font-medium">
      {message}
    </p>
  );
}

/** The sentence a refused save shows, from whatever was thrown. */
export function refusalMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Le serveur n'a pas répondu.";
}
