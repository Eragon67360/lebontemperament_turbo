// utils/roster/source.ts
//
// Server-only: reads the member roster (a private Google Sheet) with a
// service account. Import it from route handlers and server code only; it
// reads secrets from the environment and must never reach a client bundle.
//
// Environment:
// - GOOGLE_SERVICE_ACCOUNT_JSON: the service account's JSON key (same format
//   as the Supabase functions use). Share the sheet (Viewer) with its
//   `client_email`; the sheet must not be published to the web.
// - ROSTER_SHEET_ID: the spreadsheet id (the long token in its URL).
// - ROSTER_SHEET_RANGE (optional): A1 range to read. Default `A:ZZ`, i.e.
//   every used row of the first visible sheet, up to column ZZ. Set it to a
//   tab name (`Membres`) or `Membres!A:H` when the roster is not the first tab.
//
// The values grid is converted to the same row objects `Papa.parse(text,
// { header: true })` produced from the CSV export: the first row gives the
// keys as-is, missing trailing cells become "", fully empty rows are skipped,
// duplicate headers get `_1`, `_2`… suffixes. Extra cells beyond the header
// row are dropped (Papa put them under `__parsed_extra`, which nothing read).

import { createPrivateKey, createSign } from "node:crypto";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
export const DEFAULT_ROSTER_RANGE = "A:ZZ";

const REQUEST_TIMEOUT_MS = 15_000;
/** Lifetime requested for the signed assertion (Google allows up to 1 h). */
const ASSERTION_LIFETIME_S = 55 * 60;
/** Stop using a cached token this long before Google expires it. */
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

export const ROSTER_NOT_CONFIGURED_MESSAGE =
  "La synchronisation avec le tableau des membres n'est pas configurée.";

export type RosterSourceErrorCode =
  | "not_configured"
  | "not_shared"
  | "not_found"
  | "timeout"
  | "token_failed"
  | "upstream_failed"
  | "invalid_response";

const USER_MESSAGES: Record<RosterSourceErrorCode, string> = {
  not_configured: ROSTER_NOT_CONFIGURED_MESSAGE,
  not_shared:
    "Le tableau des membres n'est pas partagé avec le compte de service.",
  not_found: "Le tableau des membres est introuvable (identifiant incorrect).",
  timeout: "Le tableau des membres n'a pas répondu à temps.",
  token_failed:
    "La connexion au compte de service Google a échoué (clé invalide ?).",
  upstream_failed: "La lecture du tableau des membres a échoué.",
  invalid_response: "La lecture du tableau des membres a échoué.",
};

const HTTP_STATUS: Record<RosterSourceErrorCode, number> = {
  not_configured: 503,
  not_shared: 503,
  not_found: 503,
  timeout: 504,
  token_failed: 503,
  upstream_failed: 502,
  invalid_response: 502,
};

/**
 * Every failure of the roster source. `message` is for logs (never contains
 * the sheet id, the URL or a token), `userMessage` is French for the UI,
 * `status` the HTTP status a route should answer with.
 */
export class RosterSourceError extends Error {
  readonly code: RosterSourceErrorCode;
  readonly status: number;
  readonly userMessage: string;

  constructor(code: RosterSourceErrorCode, message: string) {
    super(message);
    this.name = "RosterSourceError";
    this.code = code;
    this.status = HTTP_STATUS[code];
    this.userMessage = USER_MESSAGES[code];
  }
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface RosterConfig {
  serviceAccount: ServiceAccount;
  sheetId: string;
  range: string;
}

interface CachedToken {
  clientEmail: string;
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/** Forgets the cached access token (tests). */
export function resetRosterTokenCache(): void {
  cachedToken = null;
}

function readConfig(): RosterConfig {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const sheetId = process.env.ROSTER_SHEET_ID?.trim();
  if (!rawJson || !sheetId) {
    throw new RosterSourceError(
      "not_configured",
      "GOOGLE_SERVICE_ACCOUNT_JSON or ROSTER_SHEET_ID is not set.",
    );
  }

  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(rawJson) as Partial<ServiceAccount>;
  } catch {
    throw new RosterSourceError(
      "not_configured",
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.",
    );
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new RosterSourceError(
      "not_configured",
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.",
    );
  }

  return {
    serviceAccount: {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
      token_uri: parsed.token_uri || DEFAULT_TOKEN_URI,
    },
    sheetId,
    range: process.env.ROSTER_SHEET_RANGE?.trim() || DEFAULT_ROSTER_RANGE,
  };
}

const base64url = (input: string): string =>
  Buffer.from(input, "utf8").toString("base64url");

/** RS256 JWT-bearer assertion for the service account (RFC 7523). */
function signAssertion(account: ServiceAccount, nowMs: number): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const iat = Math.floor(nowMs / 1000);
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: SHEETS_SCOPE,
      aud: account.token_uri,
      iat,
      exp: iat + ASSERTION_LIFETIME_S,
    }),
  );
  const signingInput = `${header}.${claims}`;

  let key;
  try {
    key = createPrivateKey(account.private_key);
  } catch {
    throw new RosterSourceError(
      "not_configured",
      "GOOGLE_SERVICE_ACCOUNT_JSON.private_key is not a valid PEM key.",
    );
  }
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(key, "base64url");
  return `${signingInput}.${signature}`;
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  what: string,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (isTimeout(error)) {
      throw new RosterSourceError(
        "timeout",
        `${what} did not answer within ${REQUEST_TIMEOUT_MS} ms.`,
      );
    }
    throw new RosterSourceError(
      "upstream_failed",
      `${what} could not be reached.`,
    );
  }
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  const now = Date.now();
  if (
    cachedToken &&
    cachedToken.clientEmail === account.client_email &&
    now < cachedToken.expiresAt - TOKEN_EXPIRY_MARGIN_MS
  ) {
    return cachedToken.value;
  }

  const assertion = signAssertion(account, now);
  const response = await fetchWithTimeout(
    account.token_uri,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
    },
    "The Google token endpoint",
  );

  let body: TokenResponse = {};
  try {
    body = (await response.json()) as TokenResponse;
  } catch {
    // handled below: no access_token
  }
  if (!response.ok || typeof body.access_token !== "string") {
    // `error` / `error_description` are OAuth codes ("invalid_grant"…),
    // never the key or a token.
    const reason =
      body.error_description ?? body.error ?? `HTTP ${response.status}`;
    throw new RosterSourceError(
      "token_failed",
      `Google token request failed: ${reason}`,
    );
  }

  const lifetimeMs = (body.expires_in ?? 3600) * 1000;
  cachedToken = {
    clientEmail: account.client_email,
    value: body.access_token,
    expiresAt: now + lifetimeMs,
  };
  return body.access_token;
}

/**
 * Converts a Sheets `values` grid into the row objects `Papa.parse(text,
 * { header: true })` gave for the CSV export. Header cells are kept as-is
 * (accents, spaces, BOM, empty strings); downstream code matches on them.
 */
export function rosterRowsFromGrid(
  values: ReadonlyArray<ReadonlyArray<unknown>> | undefined,
): Record<string, string>[] {
  if (!values || values.length === 0) return [];

  const [headerRow = [], ...dataRows] = values;
  const counts = new Map<string, number>();
  const used = new Set<string>(headerRow.map((cell) => toCell(cell)));
  const headers = headerRow.map((cell) => {
    const header = toCell(cell);
    const seen = counts.get(header) ?? 0;
    counts.set(header, seen + 1);
    if (seen === 0) return header;
    let suffix = seen;
    let renamed = `${header}_${suffix}`;
    while (used.has(renamed)) {
      suffix++;
      renamed = `${header}_${suffix}`;
    }
    used.add(renamed);
    return renamed;
  });

  const rows: Record<string, string>[] = [];
  for (const dataRow of dataRows) {
    const cells = dataRow.map((cell) => toCell(cell));
    if (cells.every((cell) => cell === "")) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function toCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

interface ValuesResponse {
  values?: unknown[][];
}

/**
 * Reads the member roster from the private sheet and returns one object per
 * row, keyed by the header row. Throws a `RosterSourceError` (with a French
 * `userMessage` and an HTTP `status`) when the source is not configured, not
 * shared with the service account, missing, or unreachable.
 */
export async function fetchRosterRows(): Promise<Record<string, string>[]> {
  const config = readConfig();
  const token = await getAccessToken(config.serviceAccount);

  const url = `${SHEETS_BASE}/${encodeURIComponent(config.sheetId)}/values/${encodeURIComponent(config.range)}`;
  const response = await fetchWithTimeout(
    url,
    { headers: { Authorization: `Bearer ${token}` } },
    "The Google Sheets API",
  );

  if (response.status === 401 || response.status === 403) {
    cachedToken = null;
    throw new RosterSourceError(
      "not_shared",
      `Google Sheets answered ${response.status}: the sheet is not shared with the service account (or the key was revoked).`,
    );
  }
  if (response.status === 404) {
    throw new RosterSourceError(
      "not_found",
      "Google Sheets answered 404: ROSTER_SHEET_ID is wrong.",
    );
  }
  if (response.status === 400) {
    throw new RosterSourceError(
      "upstream_failed",
      "Google Sheets answered 400: ROSTER_SHEET_RANGE is not a valid range of this sheet.",
    );
  }
  if (!response.ok) {
    throw new RosterSourceError(
      "upstream_failed",
      `Google Sheets answered HTTP ${response.status}.`,
    );
  }

  let body: ValuesResponse;
  try {
    body = (await response.json()) as ValuesResponse;
  } catch {
    throw new RosterSourceError(
      "invalid_response",
      "Google Sheets answered with a body that is not JSON.",
    );
  }
  if (body.values !== undefined && !Array.isArray(body.values)) {
    throw new RosterSourceError(
      "invalid_response",
      "Google Sheets answered without a values grid.",
    );
  }
  return rosterRowsFromGrid(body.values);
}
