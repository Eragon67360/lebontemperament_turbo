import type { Tables } from "../database.types";

export type AnniversaryArchive = Tables<"anniversary_archives">;
export type AnniversaryAudioMemory = Tables<"anniversary_audio_memories">;
export type AnniversaryFormConfig = Tables<"anniversary_form_config">;
export type AnniversaryHero = Tables<"anniversary_hero">;
export type AnniversaryHeroStat = Tables<"anniversary_hero_stats">;
export type AnniversaryMemory = Tables<"anniversary_memories">;
export type AnniversaryNavigationCard = Tables<"anniversary_navigation_cards">;
export type AnniversaryPhoto = Tables<"anniversary_photos">;
export type AnniversaryTimelineEvent = Tables<"anniversary_timeline_events">;
export type AnniversaryVideo = Tables<"anniversary_videos">;

/**
 * `anniversary_archives.type`: the same list as the table's CHECK constraint
 * (migration 20250124000000_create_anniversary_archives.sql).
 */
export const ARCHIVE_TYPES = [
  "assemblée-générale",
  "rapport-annuel",
  "rapport-financier",
  "gazette",
  "programme",
  "document-historique",
] as const;

export type ArchiveType = (typeof ARCHIVE_TYPES)[number];
