// Website types for the 40-ans CMS (read-only): each one is the columns the
// page selects (`lib/anniversaryColumns.ts`), typed from the table's row so
// a renamed or dropped column fails the build here. The CMS keeps a few
// nullable columns filled; `Filled` reads them as such, where
// `lib/anniversary.ts` casts the row.

import type {
  AnniversaryArchive,
  AnniversaryAudioMemory,
  AnniversaryFormConfig,
  AnniversaryHero as AnniversaryHeroRow,
  AnniversaryHeroStat,
  AnniversaryMemory,
  AnniversaryNavigationCard,
  AnniversaryPhoto,
  AnniversaryTimelineEvent,
  AnniversaryVideo,
  ArchiveType,
} from "@repo/domain/types/anniversary";

export type { ArchiveType };

/** The columns the CMS always fills, read without their `null`. */
type Filled<T> = { [K in keyof T]-?: NonNullable<T[K]> };

export type AnniversaryHero = Pick<
  AnniversaryHeroRow,
  "hero_number" | "hero_subtitle" | "description"
> &
  Filled<
    Pick<
      AnniversaryHeroRow,
      | "cta_text"
      | "cta_target_section"
      | "enable_intro_animation"
      | "skip_button_text"
    >
  >;

export type HeroStat = Pick<
  AnniversaryHeroStat,
  "id" | "icon_name" | "number" | "label" | "display_order"
>;

export type NavigationCard = Pick<
  AnniversaryNavigationCard,
  | "id"
  | "title"
  | "description"
  | "icon_name"
  | "target_section_id"
  | "display_order"
>;

export type TimelineEvent = Pick<
  AnniversaryTimelineEvent,
  "id" | "year" | "title" | "description" | "icon_name" | "display_order"
>;

export type Video = Pick<
  AnniversaryVideo,
  | "id"
  | "title"
  | "description"
  | "thumbnail_url"
  | "video_url"
  | "year"
  | "category"
  | "display_order"
>;

export type AudioMemory = Pick<
  AnniversaryAudioMemory,
  | "id"
  | "title"
  | "description"
  | "speaker_name"
  | "year"
  | "duration"
  | "audio_url"
  | "display_order"
>;

export type Photo = Pick<
  AnniversaryPhoto,
  | "id"
  | "title"
  | "description"
  | "year"
  | "category"
  | "image_url"
  | "display_order"
>;

export type FormConfig = Pick<
  AnniversaryFormConfig,
  "section_title" | "section_description"
> &
  Filled<
    Pick<
      AnniversaryFormConfig,
      | "name_label"
      | "email_label"
      | "message_label"
      | "year_label"
      | "submit_button_text"
      | "success_message"
      | "is_enabled"
    >
  >;

/**
 * A featured memory as visitors see it. The author's email stays in the
 * database for the admin's moderation screens and never reaches the website
 * (see `lib/anniversaryMemories.ts`, which fills the two flags).
 */
export type Memory = Pick<
  AnniversaryMemory,
  "id" | "name" | "message" | "year"
> &
  Filled<Pick<AnniversaryMemory, "is_featured" | "created_at">>;

/** An archive as `/40-ans/archives` lists it; `type` is one of ARCHIVE_TYPES. */
export type Archive = Pick<
  AnniversaryArchive,
  "id" | "title" | "description" | "year" | "theme" | "file_url" | "file_size"
> & { type: ArchiveType };

// Combined response types for API
export interface AnniversaryPageData {
  hero: AnniversaryHero;
  heroStats: HeroStat[];
  navigationCards: NavigationCard[];
  timelineEvents: TimelineEvent[];
  videos: Video[];
  audioMemories: AudioMemory[];
  photos: Photo[];
  formConfig: FormConfig;
  featuredMemories: Memory[];
}
