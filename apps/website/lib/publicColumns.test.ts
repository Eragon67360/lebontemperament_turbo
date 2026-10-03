// Run with: npx tsx lib/publicColumns.test.ts
//
// The public read routes select explicit column lists instead of `*`. These
// checks keep the lists honest: no row metadata or author ids reach visitors,
// and the 40-ans lists match the fields the page interfaces declare.
import assert from "node:assert/strict";
import {
  ANNIVERSARY_ARCHIVE_COLUMNS,
  ANNIVERSARY_AUDIO_MEMORY_COLUMNS,
  ANNIVERSARY_FORM_CONFIG_COLUMNS,
  ANNIVERSARY_HERO_COLUMNS,
  ANNIVERSARY_HERO_STAT_COLUMNS,
  ANNIVERSARY_NAVIGATION_CARD_COLUMNS,
  ANNIVERSARY_PHOTO_COLUMNS,
  ANNIVERSARY_TIMELINE_EVENT_COLUMNS,
  ANNIVERSARY_VIDEO_COLUMNS,
} from "./anniversaryColumns";
import {
  CONCERT_COLUMNS,
  EVENT_COLUMNS,
  MEMBER_REHEARSAL_COLUMNS,
  TOUR_COLUMNS,
} from "./publicConcerts";
import { PUBLIC_VIDEO_COLUMNS } from "./publicVideos";

const columns = (list: string) => list.split(",").map((c) => c.trim());

// Author ids and row timestamps never leave the server on public routes.
for (const [name, list] of Object.entries({
  CONCERT_COLUMNS,
  TOUR_COLUMNS,
  PUBLIC_VIDEO_COLUMNS,
  MEMBER_REHEARSAL_COLUMNS,
})) {
  const cols = columns(list);
  assert.ok(!cols.includes("created_by"), `${name} exposes created_by`);
  assert.ok(!cols.includes("*"), `${name} selects every column`);
  assert.equal(new Set(cols).size, cols.length, `${name} repeats a column`);
}

// The 40-ans lists are exactly the fields of the interfaces in
// types/anniversary.ts, so the server page and the live subscriptions
// return the same shape the components render.
assert.deepEqual(columns(ANNIVERSARY_HERO_COLUMNS), [
  "hero_number",
  "hero_subtitle",
  "description",
  "cta_text",
  "cta_target_section",
  "enable_intro_animation",
  "skip_button_text",
]);
assert.deepEqual(columns(ANNIVERSARY_HERO_STAT_COLUMNS), [
  "id",
  "icon_name",
  "number",
  "label",
  "display_order",
]);
assert.deepEqual(columns(ANNIVERSARY_NAVIGATION_CARD_COLUMNS), [
  "id",
  "title",
  "description",
  "icon_name",
  "target_section_id",
  "display_order",
]);
assert.deepEqual(columns(ANNIVERSARY_TIMELINE_EVENT_COLUMNS), [
  "id",
  "year",
  "title",
  "description",
  "icon_name",
  "display_order",
]);
assert.deepEqual(columns(ANNIVERSARY_VIDEO_COLUMNS), [
  "id",
  "title",
  "description",
  "thumbnail_url",
  "video_url",
  "year",
  "category",
  "display_order",
]);
assert.deepEqual(columns(ANNIVERSARY_AUDIO_MEMORY_COLUMNS), [
  "id",
  "title",
  "description",
  "speaker_name",
  "year",
  "duration",
  "audio_url",
  "display_order",
]);
assert.deepEqual(columns(ANNIVERSARY_PHOTO_COLUMNS), [
  "id",
  "title",
  "description",
  "year",
  "category",
  "image_url",
  "display_order",
]);
assert.deepEqual(columns(ANNIVERSARY_FORM_CONFIG_COLUMNS), [
  "section_title",
  "section_description",
  "name_label",
  "email_label",
  "message_label",
  "year_label",
  "submit_button_text",
  "success_message",
  "is_enabled",
]);
assert.deepEqual(columns(ANNIVERSARY_ARCHIVE_COLUMNS), [
  "id",
  "title",
  "description",
  "year",
  "type",
  "theme",
  "file_url",
  "file_size",
]);

// The members' agenda needs every Event field it renders, and nothing else.
assert.deepEqual(columns(EVENT_COLUMNS).sort(), [
  "created_at",
  "date_from",
  "date_to",
  "description",
  "event_type",
  "id",
  "is_public",
  "link",
  "location",
  "responsible_email",
  "responsible_name",
  "time",
  "title",
  "updated_at",
]);

console.log("publicColumns: all checks passed");
