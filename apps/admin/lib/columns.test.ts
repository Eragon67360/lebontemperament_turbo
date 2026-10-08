// Run with: npx tsx lib/columns.test.ts
//
// Each admin column list must name every column of its table, no more and no
// less, as `database.types.ts` declares it. After `npm run db:types` brings a
// new column, this fails until the column is added to `columns.ts` or left
// out on purpose below.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as columns from "./columns";

const here = dirname(fileURLToPath(import.meta.url));
const types = readFileSync(
  join(here, "../../../packages/domain/src/database.types.ts"),
  "utf8",
);

/** Table behind each list. */
const TABLES: Record<keyof typeof columns, string> = {
  FEATURE_FLAG_COLUMNS: "feature_flags",
  PROJECT_COLUMNS: "projects",
  VIDEO_COLUMNS: "youtube_links",
  FOLDER_COLUMNS: "folders",
  FILE_COLUMNS: "files",
  CA_COLUMNS: "cas",
  CONCERT_COLUMNS: "concerts",
  TOUR_COLUMNS: "tours",
  EVENT_COLUMNS: "events",
  REHEARSAL_COLUMNS: "rehearsals",
  DRIVE_FOLDER_COLUMNS: "drive_folders",
  DRIVE_SYNC_RUN_COLUMNS: "drive_sync_runs",
  PROGRAM_COLUMNS: "programs",
  GROUP_COLUMNS: "groups",
  ANNIVERSARY_HERO_COLUMNS: "anniversary_hero",
  ANNIVERSARY_HERO_STAT_COLUMNS: "anniversary_hero_stats",
  ANNIVERSARY_NAVIGATION_CARD_COLUMNS: "anniversary_navigation_cards",
  ANNIVERSARY_TIMELINE_EVENT_COLUMNS: "anniversary_timeline_events",
  ANNIVERSARY_VIDEO_COLUMNS: "anniversary_videos",
  ANNIVERSARY_AUDIO_MEMORY_COLUMNS: "anniversary_audio_memories",
  ANNIVERSARY_PHOTO_COLUMNS: "anniversary_photos",
  ANNIVERSARY_ARCHIVE_COLUMNS: "anniversary_archives",
  ANNIVERSARY_MEMORY_COLUMNS: "anniversary_memories",
  ANNIVERSARY_FORM_CONFIG_COLUMNS: "anniversary_form_config",
};

/** Columns kept out of a list on purpose: `LIST_NAME: { column: reason }`. */
const LEFT_OUT: Partial<Record<keyof typeof columns, Record<string, string>>> =
  {};

function rowColumns(table: string): string[] {
  const match = types.match(
    new RegExp(
      `\\n      ${table}: \\{\\n        Row: \\{([\\s\\S]*?)\\n        \\};`,
    ),
  );
  assert.ok(match, `table ${table} not found in database.types.ts`);
  return [...match[1]!.matchAll(/^\s+([a-z0-9_]+)\??:/gm)].map((m) => m[1]!);
}

const lists = Object.keys(columns) as (keyof typeof columns)[];
assert.deepEqual(
  [...lists].sort(),
  Object.keys(TABLES).sort(),
  "every list in columns.ts needs a table in this test",
);

for (const name of lists) {
  const list = columns[name].split(",").map((c) => c.trim());
  assert.ok(!list.includes("*"), `${name} selects every column`);
  assert.equal(new Set(list).size, list.length, `${name} repeats a column`);
  const left = Object.keys(LEFT_OUT[name] ?? {});
  const expected = rowColumns(TABLES[name]).filter((c) => !left.includes(c));
  assert.deepEqual(
    [...list].sort(),
    [...expected].sort(),
    `${name} differs from the columns of ${TABLES[name]}`,
  );
}

console.log(`columns: ${lists.length} lists match database.types.ts`);
