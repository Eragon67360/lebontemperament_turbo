/**
 * True when a PostgREST / Postgres error says the called function does not
 * exist: `PGRST202` (not in the schema cache) or `42883` (undefined function).
 * Code that depends on a migration not yet applied everywhere falls back to
 * the older path on this error and only on this error.
 */
export function isMissingFunctionError(
  error: { code?: string | null } | null | undefined,
): boolean {
  return error?.code === "PGRST202" || error?.code === "42883";
}
