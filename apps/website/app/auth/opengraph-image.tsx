import { OG_CONTENT_TYPE, OG_SIZE, sectionImage } from "@/lib/og/cards";
import { OG_SECTIONS } from "@/lib/og/sections";

// The members area sends signed-out visitors (and link-preview crawlers) to
// /auth/login, so a shared /membres link is previewed with this card.
export const alt = OG_SECTIONS.membres.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return sectionImage("membres");
}
