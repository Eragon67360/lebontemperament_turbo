import manifest from "./mediaManifest.json";

/**
 * Media files (music, PDFs, videos) live in the Supabase Storage bucket
 * `site-media`, not in git (#344). The old URLs (`/music/...`, `/pdf/...`,
 * `/videos/...`) stay valid for shipped apps and bookmarks: the route handlers
 * under `app/{music,pdf,videos}` redirect them here. The list of files and
 * their object keys is `mediaManifest.json`, written by
 * `scripts/media/media.mjs`.
 */

export type MediaFolder = "music" | "pdf" | "videos";

const normalize = (value: string) => value.normalize("NFC").trim();

const keysByPath = new Map<string, string>();
const keysByLowerPath = new Map<string, string>();
for (const file of manifest.files) {
  keysByPath.set(normalize(file.path), file.key);
  keysByLowerPath.set(normalize(file.path).toLowerCase(), file.key);
}

/** Public URL of an object key in the bucket. */
export function mediaUrlForKey(key: string): string {
  return `${manifest.baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Public URL for a path as it used to be served from `public/`, for example
 * `music/BT - Album/01 - ....mp3`. Null when the file is not in the bucket.
 */
export function mediaUrlForPath(requested: string): string | null {
  const path = normalize(requested.replace(/^\/+/, ""));
  const key = keysByPath.get(path) ?? keysByLowerPath.get(path.toLowerCase());
  return key ? mediaUrlForKey(key) : null;
}

/**
 * 308 to the bucket for an old media URL, 404 when the file does not exist.
 * The redirect is cacheable for a day only, so the host can still move later.
 */
export function mediaRedirect(
  folder: MediaFolder,
  segments: string[],
): Response {
  const target = mediaUrlForPath(`${folder}/${segments.join("/")}`);
  if (!target) return new Response("Not found", { status: 404 });
  return new Response(null, {
    status: 308,
    headers: {
      Location: target,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
