import assert from "node:assert/strict";
import { generateKeyPairSync, verify as verifySignature } from "node:crypto";
import {
  DEFAULT_ROSTER_RANGE,
  fetchRosterRows,
  resetRosterTokenCache,
  ROSTER_NOT_CONFIGURED_MESSAGE,
  rosterRowsFromGrid,
  RosterSourceError,
} from "./source";

// Everything here is fake: a throwaway RSA key, example.com hosts, made-up
// ids. `fetch` is mocked, nothing leaves the process.

const HEADERS = [
  "NOM Prénom",
  "Adresse mail",
  "Adresse postale",
  "Domicile",
  "Portable",
  "Voix",
];
const EMPTY_ROW = Object.fromEntries(HEADERS.map((h) => [h, ""]));

// --- Grid → rows (the shape Papa.parse(text, { header: true }) produced) ---

assert.deepEqual(rosterRowsFromGrid(undefined), []);
assert.deepEqual(rosterRowsFromGrid([]), []);
assert.deepEqual(rosterRowsFromGrid([HEADERS]), [], "header only: no rows");

const rows = rosterRowsFromGrid([
  HEADERS,
  ["DUPONT Marie", "marie@example.com", "1 rue Test", "", "0600000000", "Alto"],
  ["MARTIN Paul", "paul@example.com"], // short row: trailing cells missing
  [], // the API omits empty rows' cells entirely
  ["", "", ""], // fully empty row
  ["", "nobody@example.com"], // partly empty: kept (routes filter on name)
  ["DURAND Luc", "", "", "", "", "Basse", "extra cell"], // longer than header
]);
assert.equal(rows.length, 4, "empty rows are skipped");
assert.deepEqual(rows[0], {
  "NOM Prénom": "DUPONT Marie",
  "Adresse mail": "marie@example.com",
  "Adresse postale": "1 rue Test",
  Domicile: "",
  Portable: "0600000000",
  Voix: "Alto",
});
assert.deepEqual(rows[1], {
  ...EMPTY_ROW,
  "NOM Prénom": "MARTIN Paul",
  "Adresse mail": "paul@example.com",
});
assert.deepEqual(rows[2], {
  ...EMPTY_ROW,
  "Adresse mail": "nobody@example.com",
});
assert.deepEqual(rows[3], {
  ...EMPTY_ROW,
  "NOM Prénom": "DURAND Luc",
  Voix: "Basse",
});
assert.deepEqual(Object.keys(rows[3]!), HEADERS, "extra cells are dropped");

// Headers are keys as-is: BOM, accents, surrounding spaces, empty header.
// Duplicates get Papa's `_1`, `_2` suffixes.
const odd = rosterRowsFromGrid([
  ["﻿NOM Prénom", " Voix ", "", "Voix", "Voix", "Voix_1"],
  ["a", "b", "c", "d", "e", "f"],
]);
assert.deepEqual(odd[0], {
  "﻿NOM Prénom": "a",
  " Voix ": "b",
  "": "c",
  Voix: "d",
  Voix_2: "e",
  Voix_1: "f",
});

// Non-string cells (unformatted numbers, booleans) become strings.
assert.deepEqual(
  rosterRowsFromGrid([
    ["n", "b"],
    [42, true],
  ]),
  [{ n: "42", b: "true" }],
);

// --- The private read: token request, sheet request, errors ---

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
const originalFetch = globalThis.fetch;

function mockFetch(impl: (url: string, init: RequestInit) => Response) {
  calls.length = 0;
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = String(input);
    calls.push({ url, init: init ?? {} });
    return impl(url, init ?? {});
  }) as typeof fetch;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const privatePem = privateKey.export({
  type: "pkcs8",
  format: "pem",
}) as string;
const CLIENT_EMAIL = "roster-test@example-project.iam.gserviceaccount.com";
const TOKEN_URI = "https://oauth2.example.com/token";
const SHEET_ID = "fake-sheet-id-" + "x".repeat(30);
const TOKEN = "fake-access-token-" + "t".repeat(30);
const SHEETS_PREFIX = "https://sheets.googleapis.com/v4/spreadsheets/";

const tokenOk = () => json({ access_token: TOKEN, expires_in: 3599 });
const grid = [HEADERS, ["DUPONT Marie", "marie@example.com"]];

function configure(range?: string) {
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    type: "service_account",
    client_email: CLIENT_EMAIL,
    private_key: privatePem,
    token_uri: TOKEN_URI,
  });
  process.env.ROSTER_SHEET_ID = SHEET_ID;
  if (range) process.env.ROSTER_SHEET_RANGE = range;
  else delete process.env.ROSTER_SHEET_RANGE;
  resetRosterTokenCache();
}

const thrown: RosterSourceError[] = [];
async function expectError(
  code: RosterSourceError["code"],
  status: number,
): Promise<RosterSourceError> {
  let caught: unknown;
  try {
    await fetchRosterRows();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof RosterSourceError, `throws for ${code}`);
  assert.equal(caught.code, code);
  assert.equal(caught.status, status);
  assert.ok(caught.userMessage.length > 0, "has a French message");
  thrown.push(caught);
  return caught;
}

async function main() {
  // Not configured: nothing is called, the route gets a 503 and the message.
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  delete process.env.ROSTER_SHEET_ID;
  resetRosterTokenCache();
  mockFetch(() => tokenOk());
  const notConfigured = await expectError("not_configured", 503);
  assert.equal(notConfigured.userMessage, ROSTER_NOT_CONFIGURED_MESSAGE);
  assert.equal(calls.length, 0);

  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = "{not json";
  process.env.ROSTER_SHEET_ID = SHEET_ID;
  await expectError("not_configured", 503);
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: CLIENT_EMAIL,
  });
  await expectError("not_configured", 503);
  assert.equal(calls.length, 0);

  // Happy path: a signed JWT-bearer token request, then the values read.
  configure();
  mockFetch((url) => (url === TOKEN_URI ? tokenOk() : json({ values: grid })));
  const read = await fetchRosterRows();
  assert.deepEqual(read, [
    {
      ...EMPTY_ROW,
      "NOM Prénom": "DUPONT Marie",
      "Adresse mail": "marie@example.com",
    },
  ]);
  assert.equal(calls.length, 2);

  const [tokenCall, sheetCall] = calls as [Call, Call];
  assert.equal(tokenCall.url, TOKEN_URI);
  assert.equal(tokenCall.init.method, "POST");
  assert.equal(
    (tokenCall.init.headers as Record<string, string>)["Content-Type"],
    "application/x-www-form-urlencoded",
  );
  assert.ok(tokenCall.init.signal instanceof AbortSignal, "token: timeout set");
  const form = new URLSearchParams(String(tokenCall.init.body));
  assert.equal(
    form.get("grant_type"),
    "urn:ietf:params:oauth:grant-type:jwt-bearer",
  );
  const assertion = form.get("assertion") ?? "";
  const [h, c, s] = assertion.split(".");
  assert.ok(h && c && s, "assertion is a three-part JWT");
  const decode = (part: string) =>
    JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  assert.deepEqual(decode(h), { alg: "RS256", typ: "JWT" });
  const claims = decode(c);
  assert.equal(claims.iss, CLIENT_EMAIL);
  assert.equal(claims.aud, TOKEN_URI);
  assert.equal(
    claims.scope,
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  );
  const nowS = Math.floor(Date.now() / 1000);
  assert.ok(Math.abs(claims.iat - nowS) <= 5, "iat is now");
  assert.ok(claims.exp > claims.iat && claims.exp - claims.iat <= 3600);
  assert.ok(
    verifySignature(
      "sha256",
      Buffer.from(`${h}.${c}`),
      publicKey,
      Buffer.from(s, "base64url"),
    ),
    "assertion is signed with the service account key",
  );

  assert.equal(
    sheetCall.url,
    `${SHEETS_PREFIX}${SHEET_ID}/values/${encodeURIComponent(DEFAULT_ROSTER_RANGE)}`,
  );
  assert.equal(
    (sheetCall.init.headers as Record<string, string>)["Authorization"],
    `Bearer ${TOKEN}`,
  );
  assert.ok(sheetCall.init.signal instanceof AbortSignal, "sheet: timeout set");

  // The token is cached: the second read makes one call.
  await fetchRosterRows();
  assert.equal(calls.length, 3);
  assert.equal(calls[2]!.url, sheetCall.url);
  assert.equal(
    (calls[2]!.init.headers as Record<string, string>)["Authorization"],
    `Bearer ${TOKEN}`,
  );

  // A custom range is URL-encoded.
  configure("Membres!A:H");
  mockFetch((url) => (url === TOKEN_URI ? tokenOk() : json({ values: grid })));
  await fetchRosterRows();
  assert.equal(
    calls[1]!.url,
    `${SHEETS_PREFIX}${SHEET_ID}/values/${encodeURIComponent("Membres!A:H")}`,
  );

  // No values at all (empty sheet) is an empty roster, not an error.
  configure();
  mockFetch((url) => (url === TOKEN_URI ? tokenOk() : json({})));
  assert.deepEqual(await fetchRosterRows(), []);

  // Error mapping. 401/403: not shared; the cached token is dropped so the
  // next read requests a fresh one.
  for (const status of [401, 403]) {
    configure();
    mockFetch((url) =>
      url === TOKEN_URI
        ? tokenOk()
        : json({ error: { code: status, message: "no permission" } }, status),
    );
    await expectError("not_shared", 503);
    assert.equal(calls.length, 2);
    await expectError("not_shared", 503);
    assert.equal(calls.length, 4, `after ${status}, a new token is requested`);
  }

  configure();
  mockFetch((url) =>
    url === TOKEN_URI ? tokenOk() : json({ error: { code: 404 } }, 404),
  );
  await expectError("not_found", 503);

  configure();
  mockFetch((url) =>
    url === TOKEN_URI ? tokenOk() : json({ error: { code: 400 } }, 400),
  );
  await expectError("upstream_failed", 502);

  configure();
  mockFetch((url) =>
    url === TOKEN_URI ? tokenOk() : new Response("oops", { status: 500 }),
  );
  await expectError("upstream_failed", 502);

  configure();
  mockFetch((url) =>
    url === TOKEN_URI ? tokenOk() : new Response("<html>", { status: 200 }),
  );
  await expectError("invalid_response", 502);

  // Timeouts, on either request.
  const timeout = () => {
    throw new DOMException("The operation was aborted", "TimeoutError");
  };
  configure();
  mockFetch(() => timeout());
  await expectError("timeout", 504);
  configure();
  mockFetch((url) => (url === TOKEN_URI ? tokenOk() : timeout()));
  await expectError("timeout", 504);

  // Network failure.
  configure();
  mockFetch(() => {
    throw new TypeError("fetch failed");
  });
  await expectError("upstream_failed", 502);

  // Google refuses the assertion.
  configure();
  mockFetch(() =>
    json(
      { error: "invalid_grant", error_description: "Invalid JWT Signature." },
      400,
    ),
  );
  const tokenFailed = await expectError("token_failed", 503);
  assert.ok(tokenFailed.message.includes("Invalid JWT Signature."));

  // A key that is not PEM.
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: CLIENT_EMAIL,
    private_key: "not-a-key",
    token_uri: TOKEN_URI,
  });
  resetRosterTokenCache();
  mockFetch(() => tokenOk());
  await expectError("not_configured", 503);
  assert.equal(calls.length, 0);

  // No error, in any form, names the sheet, the token, or the key.
  assert.ok(thrown.length >= 14);
  for (const error of thrown) {
    for (const text of [error.message, error.userMessage, String(error)]) {
      assert.ok(!text.includes(SHEET_ID), `no sheet id in: ${text}`);
      assert.ok(!text.includes(TOKEN), `no token in: ${text}`);
      assert.ok(!text.includes("PRIVATE KEY"), `no key in: ${text}`);
      assert.ok(!text.includes(SHEETS_PREFIX), `no sheet URL in: ${text}`);
      assert.ok(!text.includes("docs.google.com"), `no sheet URL in: ${text}`);
    }
  }

  globalThis.fetch = originalFetch;
  console.log("roster/source.test.ts: all assertions passed");
}

main().catch((error) => {
  globalThis.fetch = originalFetch;
  console.error(error);
  process.exit(1);
});
