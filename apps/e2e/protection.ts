// How the suite gets past the staging sites' protection, for the browser
// contexts (playwright.config.ts) and the login in global-setup.ts:
//
// - on Vercel, Deployment Protection: the bypass header, when
//   VERCEL_AUTOMATION_BYPASS_SECRET is set;
// - on the self-hosted staging (Coolify, DEPLOYMENT.md), HTTP basic auth:
//   E2E_BASIC_AUTH_USER and E2E_BASIC_AUTH_PASSWORD, answered only to a 401
//   from the site's own origin, never sent to another host.
//
// Both can be set at once while staging moves from one host to the other.

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/** Headers every request carries: the Vercel bypass, when configured. */
export const protectionHeaders = bypassSecret
  ? { "x-vercel-protection-bypass": bypassSecret }
  : undefined;

/** Basic-auth credentials for the site at `baseURL`, when configured. */
export function basicAuthFor(baseURL: string) {
  const username = process.env.E2E_BASIC_AUTH_USER;
  const password = process.env.E2E_BASIC_AUTH_PASSWORD;
  if (!username || !password) return undefined;
  return { username, password, origin: new URL(baseURL).origin };
}
