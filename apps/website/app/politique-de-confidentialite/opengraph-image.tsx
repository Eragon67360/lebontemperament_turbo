import { OG_CONTENT_TYPE, OG_SIZE, sectionImage } from "@/lib/og/cards";
import { OG_SECTIONS } from "@/lib/og/sections";

export const alt = OG_SECTIONS.confidentialite.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return sectionImage("confidentialite");
}
