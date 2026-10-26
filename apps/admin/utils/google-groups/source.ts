// utils/google-groups/source.ts
//
// Server-only: reads a Google Group's addresses through the Apps Script web
// app (env GOOGLE_APPS_SCRIPT_URL, source in google-apps-script/Code.gs,
// read-only). Import it from route handlers and server code only.

import { appsScriptUrl } from "./appsScript";

const REQUEST_TIMEOUT_MS = 20_000;

/** Every failure, with a French message for the UI and the alert push. */
export class GroupSourceError extends Error {
  readonly userMessage: string;

  constructor(message: string, userMessage: string) {
    super(message);
    this.name = "GroupSourceError";
    this.userMessage = userMessage;
  }
}

interface ScriptResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

/** The group's addresses, as Google Groups returns them. */
export async function fetchGroupMemberEmails(
  groupEmail: string,
): Promise<string[]> {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  if (!scriptUrl) {
    throw new GroupSourceError(
      "GOOGLE_APPS_SCRIPT_URL is not set.",
      "La lecture des groupes Google n'est pas configurée.",
    );
  }

  // Holds the script's key: never logged.
  const url = appsScriptUrl(scriptUrl, { groupEmail });

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new GroupSourceError(
      `Apps Script request failed: ${error instanceof Error ? error.name : "unknown"}`,
      timedOut
        ? "Google Groups n'a pas répondu à temps."
        : "Google Groups est injoignable.",
    );
  }

  if (!response.ok) {
    throw new GroupSourceError(
      `Apps Script answered ${response.status}.`,
      response.status === 401 || response.status === 403
        ? "Le script Google qui lit les groupes refuse l'accès : il faut le réautoriser."
        : "La lecture du groupe Google a échoué.",
    );
  }

  let body: ScriptResponse;
  try {
    body = (await response.json()) as ScriptResponse;
  } catch {
    // An expired authorization answers 200 with Google's HTML sign-in page.
    throw new GroupSourceError(
      "Apps Script did not answer JSON.",
      "Le script Google qui lit les groupes ne répond plus correctement : il faut sans doute le réautoriser.",
    );
  }

  if (!body.success || !Array.isArray(body.data)) {
    throw new GroupSourceError(
      `Apps Script reported a failure: ${String(body.message ?? "").slice(0, 200)}`,
      "Le groupe Google n'a pas pu être lu (adresse du groupe incorrecte, ou accès retiré).",
    );
  }

  return body.data
    .map((item) =>
      typeof item === "string"
        ? item
        : item && typeof item === "object" && "email" in item
          ? String((item as { email: unknown }).email ?? "")
          : "",
    )
    .filter(Boolean);
}
