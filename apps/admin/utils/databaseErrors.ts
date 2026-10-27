// The admin routes' answer for a failed database call (CODE-004): the status
// and French wording of `describeDatabaseError` (@repo/domain), the
// database's own error in the server log only.
import { describeDatabaseError } from "@repo/domain/utils/supabaseErrors";
import { NextResponse } from "next/server";

/** `{ error }` with the status for `error`; `fallback` when it is the server's. */
export function databaseErrorResponse(error: unknown, fallback: string) {
  const answer = describeDatabaseError(error, fallback);
  console.error(fallback, error);
  return NextResponse.json({ error: answer.error }, { status: answer.status });
}
