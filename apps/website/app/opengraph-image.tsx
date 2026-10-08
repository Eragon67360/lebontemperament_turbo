import { brandImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/cards";

// The home page's card, inherited by every page without one of its own
// (sign-in pages, members sub-pages, download, track).
export const alt =
  "Le Bon Tempérament, chœur et orchestre à Saverne depuis 1987";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandImage();
}
