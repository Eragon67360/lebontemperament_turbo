// Server-only: the URL of a request to the Apps Script web app that reads
// Google Groups (env GOOGLE_APPS_SCRIPT_URL; the script's source is
// apps/admin/google-apps-script/Code.gs). The script answers only to requests
// that carry its key, GOOGLE_APPS_SCRIPT_KEY, added here: never log the URL
// this returns, and never send it to a browser.

/**
 * `scriptUrl` with these query parameters (empty ones left out) and, when
 * GOOGLE_APPS_SCRIPT_KEY is set, the script's `key`.
 */
export function appsScriptUrl(
  scriptUrl: string,
  params: Record<string, string | null | undefined>,
): URL {
  const url = new URL(scriptUrl);
  for (const [name, value] of Object.entries(params)) {
    if (value) url.searchParams.set(name, value);
  }
  const key = process.env.GOOGLE_APPS_SCRIPT_KEY?.trim();
  if (key) url.searchParams.set("key", key);
  return url;
}
