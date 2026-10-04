// The gallery's YouTube links (#480): what an admin may paste (a watch,
// share, shorts or embed URL, or the bare 11-character id), the canonical
// URL the row stores, and the thumbnail the list shows. The website reads
// the stored URL through `extractYouTubeId`, so the stored form must stay
// a youtube.com URL: a bare id would not play there.
import { extractYouTubeId } from "@repo/domain/utils/youtube";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** The video id of a pasted URL or bare id; null when nothing usable. */
export function parseYouTubeInput(
  input: string | null | undefined,
): string | null {
  const value = (input ?? "").trim();
  if (!value) return null;
  if (VIDEO_ID.test(value)) return value;
  const id = extractYouTubeId(value);
  return id || null;
}

/** The URL stored in `youtube_links.youtube_url`. */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** YouTube's own 480×360 thumbnail, a plain image (no iframe per card). */
export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** "Jean, Marie , ,Paul" → ["Jean", "Marie", "Paul"] */
export function parseSoloists(input: string | null | undefined): string[] {
  return (input ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
