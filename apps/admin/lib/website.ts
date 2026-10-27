/**
 * The public website this admin deployment talks to.
 *
 * `NEXT_PUBLIC_WEBSITE_URL` names it per environment: the production admin
 * points at https://www.lebontemperament.com, staging and previews at
 * https://dev.lebontemperament.com, a local checkout at http://localhost:3000
 * (the website's pinned dev port; the admin's own is 3002). Every link,
 * preview frame, fetch and cache call aimed at the website goes through this
 * module, so that all of them agree on one address and one fallback.
 */

/** Where website links go when nothing is configured: the public site. */
export const PRODUCTION_WEBSITE_URL = "https://www.lebontemperament.com";

/**
 * The configured website origin (`NEXT_PUBLIC_WEBSITE_URL`), trimmed and
 * without a trailing slash; undefined when the variable is unset or blank.
 * For the callers that must not guess (the cache revalidation call).
 */
export function configuredWebsiteUrl(
  value: string | undefined = process.env.NEXT_PUBLIC_WEBSITE_URL,
): string | undefined {
  const origin = value?.trim().replace(/\/+$/, "");
  return origin || undefined;
}

/**
 * An address on the website: the configured origin, or production when none
 * is configured, followed by `path` (`/concerts`, `/40-ans`…; a missing
 * leading slash is added).
 */
export function websiteUrl(
  path = "",
  value: string | undefined = process.env.NEXT_PUBLIC_WEBSITE_URL,
): string {
  const origin = configuredWebsiteUrl(value) ?? PRODUCTION_WEBSITE_URL;
  if (!path) return origin;
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}

/** The website's origin for this deployment, for `${WEBSITE_URL}${path}` links. */
export const WEBSITE_URL = websiteUrl();

/** The website's host without `www.`, for link text (« lebontemperament.com »). */
export function websiteHost(url: string = WEBSITE_URL) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
