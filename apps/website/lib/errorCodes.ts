/** The codes `errorCodes` keeps; each one only when present. */
export type ErrorCodes = {
  /** Error class: `SyntaxError`, `TypeError`, `Error`… */
  name?: string;
  /** Library or system code: Postgres `23514`, SMTP `EAUTH`, `ECONNRESET`… */
  code?: string | number;
  /** HTTP status of the failed request (Google APIs, Supabase Auth). */
  status?: number;
  /** SMTP reply code (nodemailer). */
  responseCode?: number;
  /** SMTP command that failed: `AUTH PLAIN`, `RCPT TO`, `DATA`… */
  command?: string;
  /** Code the remote API answered: OAuth `invalid_grant`, Drive `notFound`… */
  reason?: string;
  /** `code` of the underlying cause, e.g. `ENOTFOUND` behind `fetch failed`. */
  cause?: string | number;
};

/** A short identifier: letters, digits, `_ . : -`, at most one inner space. */
const CODE_LIKE = /^[\w.:-]+( [\w.:-]+)?$/;
const MAX_CODE_LENGTH = 40;

/** Reads `source[key]` without ever throwing (exotic getters included). */
function field(source: unknown, key: string | number): unknown {
  if (source === null || typeof source !== "object") return undefined;
  try {
    return (source as Record<string | number, unknown>)[key];
  } catch {
    return undefined;
  }
}

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Code-like strings only: free text, addresses and URLs are dropped. */
const asCode = (value: unknown): string | undefined =>
  typeof value === "string" &&
  value.length <= MAX_CODE_LENGTH &&
  CODE_LIKE.test(value)
    ? value
    : undefined;

/**
 * What a server log line keeps of a caught error: its class and its codes,
 * never its message, details or payload. Those can quote what the failing
 * call carried: a JSON parse error quotes the request body, a mail error the
 * recipient's address, a database error the failing row, a Google API error
 * the token request. Log this instead of the error wherever the call handled
 * personal data or credentials:
 *
 *   console.error("[api/contact] Email sending error:", errorCodes(error));
 *   // { name: 'Error', code: 'EENVELOPE', responseCode: 550, command: 'RCPT TO' }
 */
export function errorCodes(error: unknown): ErrorCodes {
  if (error === null || typeof error !== "object") {
    return { name: error === null ? "null" : typeof error };
  }

  const response = field(error, "response");
  // OAuth answers {"error":"invalid_grant"}; Google APIs answer
  // {"error":{"errors":[{"reason":"notFound"}]}}.
  const apiError = field(field(response, "data"), "error");
  const code = asNumber(field(error, "code")) ?? asCode(field(error, "code"));
  const causeCode = field(field(error, "cause"), "code");
  const cause = asNumber(causeCode) ?? asCode(causeCode);

  const codes: ErrorCodes = {
    name: asCode(field(error, "name")),
    code,
    status:
      asNumber(field(error, "status")) ?? asNumber(field(response, "status")),
    responseCode: asNumber(field(error, "responseCode")),
    command: asCode(field(error, "command")),
    reason:
      asCode(apiError) ??
      asCode(field(field(field(apiError, "errors"), 0), "reason")),
    // Only when it adds something: gaxios repeats the HTTP status there.
    cause: cause === code ? undefined : cause,
  };

  return Object.fromEntries(
    Object.entries(codes).filter(([, value]) => value !== undefined),
  ) as ErrorCodes;
}
