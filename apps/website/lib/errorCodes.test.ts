// Run with: npx tsx lib/errorCodes.test.ts
import assert from "node:assert/strict";
import { format } from "node:util";
import { errorCodes } from "./errorCodes";

// Fake values only: the repository is public.
const NAME = "Prénom NOM";
const EMAIL = "member@example.com";
const TOKEN = "fake-refresh-token-" + "0".repeat(8);
const SCRIPT_URL = "https://script.example.com/macros/s/fake-deployment-id";

/** The line `console.error("[route] failed:", value)` writes to the logs. */
const logLine = (value: unknown) => format("[route] failed:", value);

/** Checks the codes kept, and that none of the private values is printed. */
function check(error: unknown, expected: object, privateValue: string) {
  // What logging the error itself would print.
  assert.ok(logLine(error).includes(privateValue), privateValue);
  assert.deepEqual(errorCodes(error), expected);
  assert.ok(!logLine(errorCodes(error)).includes(privateValue), privateValue);
}

const thrown = (run: () => unknown): unknown => {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("expected a throw");
};

// A request body that is not JSON: V8 quotes its start in the message.
check(
  thrown(() => JSON.parse(`${NAME} <${EMAIL}>`)),
  { name: "SyntaxError" },
  NAME,
);

// A misconfigured URL: Node keeps the whole input on the error.
check(
  thrown(() => new URL(`not a url/${SCRIPT_URL}`)),
  { name: "TypeError", code: "ERR_INVALID_URL" },
  SCRIPT_URL,
);

// An SMTP refusal, shaped as nodemailer builds it (smtp-connection).
const smtpReply = `550 5.1.1 <${EMAIL}>: Recipient address rejected`;
check(
  Object.assign(
    new Error(`Can't send mail - all recipients were rejected: ${smtpReply}`),
    {
      code: "EENVELOPE",
      response: smtpReply,
      responseCode: 550,
      command: "RCPT TO",
      rejected: [EMAIL],
    },
  ),
  { name: "Error", code: "EENVELOPE", responseCode: 550, command: "RCPT TO" },
  EMAIL,
);

// A refused insert, as supabase-js returns it: `details` holds the row.
check(
  {
    code: "23514",
    message:
      'new row for relation "anniversary_memories" violates check constraint "anniversary_memories_year_check"',
    details: `Failing row contains (1, ${NAME}, ${EMAIL}, Bonjour, 1890).`,
    hint: null,
  },
  { code: "23514" },
  EMAIL,
);

// A refused Google token refresh, shaped as gaxios builds it: the request
// body (with the refresh token) rides along in `config`.
check(
  Object.assign(new Error("invalid_grant"), {
    config: {
      url: new URL("https://oauth2.googleapis.com/token"),
      method: "POST",
      data: new URLSearchParams({
        refresh_token: TOKEN,
        client_id: "fake-client-id",
      }),
    },
    response: {
      status: 400,
      data: {
        error: "invalid_grant",
        error_description: "Token has been expired or revoked.",
      },
    },
    code: 400,
    status: 400,
  }),
  { name: "Error", code: 400, status: 400, reason: "invalid_grant" },
  TOKEN,
);

// A Drive API error keeps its reason.
assert.deepEqual(
  errorCodes(
    Object.assign(new Error("File not found: fake-file-id."), {
      code: 404,
      status: 404,
      response: {
        status: 404,
        data: { error: { code: 404, errors: [{ reason: "notFound" }] } },
      },
    }),
  ),
  { name: "Error", code: 404, status: 404, reason: "notFound" },
);

// A network failure keeps the code of its cause.
assert.deepEqual(
  errorCodes(
    new TypeError("fetch failed", {
      cause: Object.assign(new Error("getaddrinfo ENOTFOUND"), {
        code: "ENOTFOUND",
      }),
    }),
  ),
  { name: "TypeError", cause: "ENOTFOUND" },
);

// Fields that are not code-like are dropped, whatever their name.
assert.deepEqual(
  errorCodes({
    name: `Bonjour, je suis ${NAME}`,
    code: EMAIL,
    command: `RCPT TO:<${EMAIL}>`,
  }),
  {},
);
assert.deepEqual(errorCodes({ code: "x".repeat(41) }), {});

// Anything can be thrown.
assert.deepEqual(errorCodes("oops"), { name: "string" });
assert.deepEqual(errorCodes(undefined), { name: "undefined" });
assert.deepEqual(errorCodes(null), { name: "null" });

// A getter that throws never makes the logging throw.
assert.deepEqual(
  errorCodes(
    Object.defineProperty(new Error("x"), "response", {
      get() {
        throw new Error("unreadable");
      },
    }),
  ),
  { name: "Error" },
);

console.log("errorCodes: all assertions passed");
