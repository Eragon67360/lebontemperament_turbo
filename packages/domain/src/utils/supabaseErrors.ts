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

/** What an API route answers for a failed database call. */
export type DatabaseErrorAnswer = {
  status: 400 | 403 | 404 | 409 | 500;
  error: string;
};

/**
 * The answer for a failed PostgREST / Postgres call, in French for the person
 * using the screen. The database's own message is never passed on: it names
 * tables, columns and constraints. By code:
 * - a value the database refuses (class 22: wrong type, bad date, too long;
 *   23502: missing; 23514: a check): the request's fault, 400;
 * - `PGRST116`, `.single()` found no row: 404;
 * - `23505`, the row already exists: 409;
 * - `42501`, the row-level policies refuse the write: 403;
 * - anything else, or not a database error at all: 500 with `fallback`.
 * `23503` (foreign key) means « still used » on a delete but « missing » on
 * an insert: the routes where it can happen word it themselves.
 */
export function describeDatabaseError(
  error: unknown,
  fallback: string,
): DatabaseErrorAnswer {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : null;
  if (typeof code !== "string") return { status: 500, error: fallback };
  if (code.startsWith("22") || code === "23502" || code === "23514") {
    return { status: 400, error: "Valeurs refusées par la base de données" };
  }
  switch (code) {
    case "PGRST116":
      return { status: 404, error: "Élément introuvable" };
    case "23505":
      return { status: 409, error: "Cet élément existe déjà" };
    case "42501":
      return { status: 403, error: "Action non autorisée" };
    default:
      return { status: 500, error: fallback };
  }
}
