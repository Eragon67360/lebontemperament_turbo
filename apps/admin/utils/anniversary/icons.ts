// The nine icons the 40 ans page can show on a hero figure, a navigation
// card or a timeline event. The database stores the react-icons name
// (`FaMusic`…); the admin shows the human label and never the identifier.
import { ICON_OPTIONS, type IconName } from "@/types/anniversary";

export const ICON_LABELS: Record<IconName, string> = {
  FaMusic: "Musique",
  FaTrophy: "Trophée",
  FaUsers: "Personnes",
  FaCalendarAlt: "Calendrier",
  FaHistory: "Histoire",
  FaVideo: "Vidéo",
  FaHeadphones: "Écoute",
  FaImages: "Photos",
  FaHeart: "Cœur",
};

export const DEFAULT_ICON: IconName = "FaMusic";

export function isIconName(value: unknown): value is IconName {
  return (
    typeof value === "string" &&
    (ICON_OPTIONS as readonly string[]).includes(value)
  );
}

/** The label of a stored icon name, or of the default icon when unknown. */
export function iconLabel(value: string | null | undefined): string {
  return ICON_LABELS[isIconName(value) ? value : DEFAULT_ICON];
}
