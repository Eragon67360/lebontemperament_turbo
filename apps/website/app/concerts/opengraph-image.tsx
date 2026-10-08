import { nextConcertImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/cards";
import { fetchNextConcert } from "@/lib/og/data";

// The next announced concert, refreshed with the agenda page (five minutes,
// or the admin's /api/revalidate).
export const revalidate = 300;

export const alt = "Agenda des concerts du Bon Tempérament";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return nextConcertImage(await fetchNextConcert());
}
