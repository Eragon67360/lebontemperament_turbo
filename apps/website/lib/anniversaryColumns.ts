/**
 * Column lists for the 40-ans CMS reads, one per interface in
 * `types/anniversary.ts`: the page (server) and its live-update
 * subscriptions (client) select the same columns, which are exactly the
 * fields the components render. Timestamps and `is_visible` (a filter,
 * not a field) stay in the database. Memories have their own list in
 * `lib/anniversaryMemories.ts` because the author's email must never
 * leave the server.
 */

export const ANNIVERSARY_HERO_COLUMNS =
  "hero_number, hero_subtitle, description, cta_text, cta_target_section, enable_intro_animation, skip_button_text";

export const ANNIVERSARY_HERO_STAT_COLUMNS =
  "id, icon_name, number, label, display_order";

export const ANNIVERSARY_NAVIGATION_CARD_COLUMNS =
  "id, title, description, icon_name, target_section_id, display_order";

export const ANNIVERSARY_TIMELINE_EVENT_COLUMNS =
  "id, year, title, description, icon_name, display_order";

export const ANNIVERSARY_VIDEO_COLUMNS =
  "id, title, description, thumbnail_url, video_url, year, category, display_order";

export const ANNIVERSARY_AUDIO_MEMORY_COLUMNS =
  "id, title, description, speaker_name, year, duration, audio_url, display_order";

export const ANNIVERSARY_PHOTO_COLUMNS =
  "id, title, description, year, category, image_url, display_order";

export const ANNIVERSARY_FORM_CONFIG_COLUMNS =
  "section_title, section_description, name_label, email_label, message_label, year_label, submit_button_text, success_message, is_enabled";

export const ANNIVERSARY_ARCHIVE_COLUMNS =
  "id, title, description, year, type, theme, file_url, file_size";
