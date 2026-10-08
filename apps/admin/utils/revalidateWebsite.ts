// utils/revalidateWebsite.ts
// Tells the public website to drop its cached pages after an admin change.
// The website serves /concerts, /galerie, the concert stories and the home
// page from the cache (apps/website: `export const revalidate`), and
// `POST /api/revalidate` there is what makes an edit visible within seconds.
//
// Best effort by design: a failure (secret unset, website down, timeout) is
// logged and never fails the admin request — the website refreshes by itself
// at the latest when its revalidate window elapses.
import { after } from "next/server";

type RevalidatePath = string | { path: string; type: "page" | "layout" };

export type RevalidateRequest = {
  paths?: RevalidatePath[];
  tags?: string[];
};

/** Website routes/patterns as `revalidatePath` expects them. */
export const WEBSITE_PATHS = {
  home: "/",
  concerts: "/concerts",
  concertStories: { path: "/concerts/[slug]", type: "page" },
  gallery: "/galerie",
  /** The general assembly page (newest published AG). */
  generalAssembly: "/ag",
  sitemap: "/sitemap.xml",
  /** The root layout: every page (feature flags are read there). */
  everything: { path: "/", type: "layout" },
} as const satisfies Record<string, RevalidatePath>;

/** Cache tags, mirrored from apps/website/lib/cacheTags.ts. */
export const WEBSITE_TAGS = {
  featureFlags: "feature-flags",
  galleryImages: "gallery-images",
} as const;

/** What each kind of change invalidates. */
export const REVALIDATE = {
  /** concerts, tours, events, rehearsals: the agenda */
  agenda: { paths: [WEBSITE_PATHS.concerts] },
  /** concert stories (`projects`): the agenda, every story, the home teaser, the sitemap */
  stories: {
    paths: [
      WEBSITE_PATHS.concerts,
      WEBSITE_PATHS.concertStories,
      WEBSITE_PATHS.home,
      WEBSITE_PATHS.sitemap,
    ],
  },
  /** general assemblies: their page and the home page's announcement */
  assemblies: { paths: [WEBSITE_PATHS.generalAssembly, WEBSITE_PATHS.home] },
  /** YouTube links */
  videos: { paths: [WEBSITE_PATHS.gallery] },
  /** feature flags are read in the root layout: everything, plus the sitemap */
  featureFlags: {
    tags: [WEBSITE_TAGS.featureFlags],
    paths: [WEBSITE_PATHS.everything, WEBSITE_PATHS.sitemap],
  },
  /** Cloudinary uploads/deletes: the gallery listing and the page showing it */
  galleryImages: {
    tags: [WEBSITE_TAGS.galleryImages],
    paths: [WEBSITE_PATHS.gallery],
  },
} as const satisfies Record<string, RevalidateRequest>;

const TIMEOUT_MS = 3000;

/**
 * Calls the website's revalidation endpoint. Resolves to `true` when the
 * website confirmed; `false` (after logging) in every other case. Never throws.
 */
export async function revalidateWebsite(
  request: RevalidateRequest,
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!baseUrl || !secret) {
    console.warn(
      "[revalidateWebsite] skipped: NEXT_PUBLIC_WEBSITE_URL or REVALIDATE_SECRET is not set",
    );
    return false;
  }

  try {
    const response = await fetch(new URL("/api/revalidate", baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(request),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(
        `[revalidateWebsite] website answered ${response.status} for ${JSON.stringify(request)}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      "[revalidateWebsite] failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Schedules `revalidateWebsite` to run once the admin's response has been
 * sent (Next.js `after`), so the mutation route neither waits for the
 * website nor fails because of it. Call it from a Route Handler after a
 * successful write.
 */
export function revalidateWebsiteAfterResponse(
  request: RevalidateRequest,
): void {
  after(() => revalidateWebsite(request));
}
