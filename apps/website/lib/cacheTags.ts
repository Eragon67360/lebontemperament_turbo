/**
 * Cache tags shared by the website's cached readers and `POST /api/revalidate`.
 * The admin names them when it calls the endpoint after a change
 * (`apps/admin/utils/revalidateWebsite.ts`), so keep both lists in sync.
 */
export const CACHE_TAGS = {
  /** `feature_flags` rows (read once per page render, see lib/featureFlags.ts). */
  featureFlags: "feature-flags",
  /** Cloudinary listing of `Site/galerie/*` behind `/api/images`. */
  galleryImages: "gallery-images",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const KNOWN_CACHE_TAGS: readonly string[] = Object.values(CACHE_TAGS);
