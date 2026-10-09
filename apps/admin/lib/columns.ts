/**
 * Column lists for the admin's table reads and write responses, one per table.
 * Each list is every column of the table's row type: the admin's editors show
 * and edit whole rows, so the payload is the same as `select("*")` had, but
 * a column added by a migration no longer reaches the browser unnoticed.
 * `columns.test.ts` compares each list with `database.types.ts`: after
 * `npm run db:types` it fails until the new column is added here (or left
 * out on purpose, with the reason, in `LEFT_OUT` there).
 *
 * Plain string literals, not `.join()`: the typed Supabase client infers the
 * row type from the literal and rejects an unknown column name.
 */

/** Feature flags (`/api/feature-flags`). */
export const FEATURE_FLAG_COLUMNS =
  "created_at, description, flag_key, flag_name, id, is_enabled, updated_at";

/** Concert stories (`projects`); the editor shows and edits every field. */
export const PROJECT_COLUMNS =
  "author_name, banniere, banniere_photographer_name, banniere_photographer_url, created_at, date, display_order, explanation, id, image, image2, image2_photographer_name, image2_photographer_url, image3, image3_photographer_name, image3_photographer_url, name, press_articles, slug, sub_name, text1, text2, updated_at";

/** Videos (`youtube_links`). */
export const VIDEO_COLUMNS =
  "composer, created_at, created_by, display_order, id, is_active, performance_date, soloists, title, updated_at, venue, youtube_url";

/** Legacy Storage explorer: folders. */
export const FOLDER_COLUMNS =
  "created_at, group_id, id, name, parent_folder_id, path, program_id, updated_at";

/** Legacy Storage explorer: files. */
export const FILE_COLUMNS =
  "created_at, folder_id, group_id, id, mime_type, name, original_name, program_id, size, storage_path, updated_at, uploaded_by";

/** Board meeting minutes (`cas`). */
export const CA_COLUMNS =
  "created_at, created_by, date_from, file_url, id, title, updated_at";

/** Concerts. */
export const CONCERT_COLUMNS =
  "additional_informations, affiche, context, created_at, created_by, city, country, date, event_data_generated_at, id, is_free, name, place, postal_code, price, related_link, street_address, time, tour_id, updated_at, venue_name";

/** Tours. */
export const TOUR_COLUMNS =
  "context, created_at, created_by, description, end_date, id, is_active, name, start_date, tour_poster, updated_at";

/** Events. */
export const EVENT_COLUMNS =
  "created_at, date_from, date_to, description, event_type, id, is_public, link, location, responsible_email, responsible_name, time, title, updated_at";

/** Rehearsals. */
export const REHEARSAL_COLUMNS =
  "address, created_at, date, end_time, event_id, google_updated_at, group_type, id, name, place, room, start_time, updated_at";

/** Drive roots by group. */
export const DRIVE_FOLDER_COLUMNS =
  "created_at, display_order, folder_id, id, label, slug, updated_at";

/** Drive sync runs (history and last diff). */
export const DRIVE_SYNC_RUN_COLUMNS =
  "counts, diff, error, finished_at, id, mode, started_at, status, trigger, triggered_by";

/** Programmes (legacy workspace). */
export const PROGRAM_COLUMNS =
  "created_at, end_date, id, is_active, name, start_date";

/** Groups (legacy workspace). */
export const GROUP_COLUMNS =
  "created_at, description, icon, id, name, order_index, slug, type";

/** 40-ans CMS: hero. */
export const ANNIVERSARY_HERO_COLUMNS =
  "created_at, cta_target_section, cta_text, description, enable_intro_animation, hero_number, hero_subtitle, id, skip_button_text, updated_at";

/** 40-ans CMS: hero statistics. */
export const ANNIVERSARY_HERO_STAT_COLUMNS =
  "created_at, display_order, icon_name, id, is_visible, label, number, updated_at";

/** 40-ans CMS: navigation cards. */
export const ANNIVERSARY_NAVIGATION_CARD_COLUMNS =
  "created_at, description, display_order, icon_name, id, is_visible, target_section_id, title, updated_at";

/** 40-ans CMS: timeline. */
export const ANNIVERSARY_TIMELINE_EVENT_COLUMNS =
  "created_at, description, display_order, icon_name, id, is_visible, title, updated_at, year";

/** 40-ans CMS: videos. */
export const ANNIVERSARY_VIDEO_COLUMNS =
  "category, created_at, description, display_order, id, is_visible, thumbnail_url, title, updated_at, video_url, year";

/** 40-ans CMS: audio memories. */
export const ANNIVERSARY_AUDIO_MEMORY_COLUMNS =
  "audio_url, created_at, description, display_order, duration, id, is_visible, speaker_name, title, updated_at, year";

/** 40-ans CMS: photos. */
export const ANNIVERSARY_PHOTO_COLUMNS =
  "category, created_at, description, display_order, id, image_url, is_visible, title, updated_at, year";

/** 40-ans CMS: archives. */
export const ANNIVERSARY_ARCHIVE_COLUMNS =
  "created_at, description, file_size, file_url, id, is_visible, theme, title, type, updated_at, year";

/** 40-ans CMS: visitors' memories (the moderation screen shows the author's email). */
export const ANNIVERSARY_MEMORY_COLUMNS =
  "created_at, email, id, is_approved, is_featured, message, name, updated_at, year";

/** 40-ans CMS: memory form texts. */
export const ANNIVERSARY_FORM_CONFIG_COLUMNS =
  "created_at, email_label, id, is_enabled, message_label, name_label, section_description, section_title, submit_button_text, success_message, updated_at, year_label";
