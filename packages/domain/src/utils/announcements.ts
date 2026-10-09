// Website announcements (public.site_announcements, edited in the admin under
// Site public › Annonces): the buttons under the home page's title and the
// donation campaign card in the navigation. Same limits as the table's CHECK
// constraints (supabase/migrations/20261009020000_site_announcements.sql).
import { parisToday } from "./parisDay";

export const ANNOUNCEMENT_PLACEMENTS = ["home", "donation_popover"] as const;
export type AnnouncementPlacement = (typeof ANNOUNCEMENT_PLACEMENTS)[number];

export const ANNOUNCEMENT_TITLE_MAX = 80;
export const ANNOUNCEMENT_BODY_MAX = 300;
export const ANNOUNCEMENT_LINK_LABEL_MAX = 40;
export const ANNOUNCEMENT_LINK_MAX = 500;

/** How many may be live at once in each place. */
export const ANNOUNCEMENT_LIMITS: Record<AnnouncementPlacement, number> = {
  home: 2,
  donation_popover: 1,
};

/** A path on the website (`/don`) or an https address; nothing else. */
export const ANNOUNCEMENT_LINK_PATTERN = /^(\/([^/]|$)|https:\/\/\S+$)/;

/** The donation card shown before announcements came from the admin. Its id
 * (seeded by the migration) keeps the « already seen » key browsers hold. */
export const LEGACY_DONATION_ANNOUNCEMENT_ID =
  "5d6f0b0e-2a43-4c1b-9b7e-0c1a2d3e4f50";

/**
 * Whether an announcement shows on `today` (Paris day, YYYY-MM-DD): from its
 * start day to its end day included; open-ended on either side when unset.
 */
export function isAnnouncementLive(
  window: { starts_on: string | null; ends_on: string | null },
  today: string = parisToday(),
): boolean {
  if (window.starts_on && today < window.starts_on) return false;
  if (window.ends_on && today > window.ends_on) return false;
  return true;
}

/** « En ligne », « Programmée », « Terminée » for a published announcement. */
export function announcementPhase(
  window: { starts_on: string | null; ends_on: string | null },
  today: string = parisToday(),
): "live" | "scheduled" | "ended" {
  if (window.starts_on && today < window.starts_on) return "scheduled";
  if (window.ends_on && today > window.ends_on) return "ended";
  return "live";
}

/** Whether a link leaves the website (opens in a new tab). */
export function isExternalLink(url: string): boolean {
  return url.startsWith("https://");
}
