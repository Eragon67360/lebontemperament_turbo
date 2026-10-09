// « Deux annonces au plus sur l'accueil, une seule carte de dons »: how many
// published announcements of one placement would be on the site at once.
import {
  ANNOUNCEMENT_LIMITS,
  type AnnouncementPlacement,
} from "@repo/domain/utils/announcements";
import { parisToday } from "@repo/domain/utils/parisDay";

type Window = { starts_on: string | null; ends_on: string | null };

/** Whether two day ranges (open-ended when null) share at least one day. */
export function windowsOverlap(a: Window, b: Window): boolean {
  const startA = a.starts_on ?? "0000-01-01";
  const endA = a.ends_on ?? "9999-12-31";
  const startB = b.starts_on ?? "0000-01-01";
  const endB = b.ends_on ?? "9999-12-31";
  return startA <= endB && startB <= endA;
}

/**
 * The message refusing `candidate` when publishing it would put more than the
 * placement's limit on the site on some day, or null when it fits. `others`
 * are the placement's other published announcements; ended ones don't count.
 */
export function overLimitMessage(
  placement: AnnouncementPlacement,
  candidate: Window,
  others: Window[],
  today: string = parisToday(),
): string | null {
  const limit = ANNOUNCEMENT_LIMITS[placement];
  const clashing = others.filter(
    (o) => !(o.ends_on && o.ends_on < today) && windowsOverlap(candidate, o),
  );
  if (clashing.length < limit) return null;
  return placement === "home"
    ? "Deux annonces au plus sur l'accueil aux mêmes dates : terminez ou repassez-en une en brouillon d'abord."
    : "Une seule carte de dons à la fois : terminez ou repassez l'autre en brouillon d'abord.";
}
