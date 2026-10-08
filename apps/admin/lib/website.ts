/** The public website, as configured for this deployment (staging points at dev). */
export const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://www.lebontemperament.com";

/** The website's host without `www.`, for link text (« lebontemperament.com »). */
export function websiteHost(url: string = WEBSITE_URL) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
