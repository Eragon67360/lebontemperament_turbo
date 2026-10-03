import type { Video } from "@repo/domain/types/videos";

/**
 * Columns `/api/videos` serves to the gallery and the featured-videos
 * bubble: what they render, nothing about who created the row or when.
 * The gallery page's JSON-LD keeps its own narrower list.
 */
export const PUBLIC_VIDEO_COLUMNS =
  "id, title, composer, venue, youtube_url, performance_date, soloists, display_order";
export type PublicVideo = Pick<
  Video,
  | "id"
  | "title"
  | "composer"
  | "venue"
  | "youtube_url"
  | "performance_date"
  | "soloists"
  | "display_order"
>;
