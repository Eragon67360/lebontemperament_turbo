import { assertEquals } from "jsr:@std/assert@1";

import {
  adminEditIsNewest,
  editedByHand,
  locationFromRow,
  sameLocation,
} from "./admin-edits.ts";
import { KNOWN_PLACES } from "./place-rules.ts";
import type { GoogleCalendarEvent, RehearsalRow } from "./types.ts";

const row = (over: Partial<RehearsalRow> = {}): RehearsalRow => ({
  id: "r1",
  name: "Répétition",
  place: "Nordheim",
  date: "2026-11-04",
  start_time: "20:00",
  end_time: "22:00",
  group_type: "Femmes",
  event_id: "e1",
  google_updated_at: "2026-10-01T10:00:00Z",
  address: null,
  room: null,
  updated_at: "2026-10-09T12:00:00Z",
  calendar_synced_at: "2026-10-09T12:00:00Z",
  ...over,
});

const event = (updated: string): GoogleCalendarEvent => ({
  id: "e1",
  updated,
  summary: "Répétition",
});

Deno.test("a sync write is not an edit, a later update is", () => {
  assertEquals(editedByHand(row()), false);
  assertEquals(
    editedByHand(row({ updated_at: "2026-10-09T12:00:00.400Z" })),
    false,
  );
  assertEquals(editedByHand(row({ updated_at: "2026-10-09T14:30:00Z" })), true);
  // Never stamped (a row the migration did not know): nothing to compare.
  assertEquals(editedByHand(row({ calendar_synced_at: null })), false);
});

Deno.test(
  "the admin's edit wins only while Google has not changed since",
  () => {
    const edited = row({ updated_at: "2026-10-09T14:30:00Z" });
    assertEquals(
      adminEditIsNewest(edited, event("2026-10-09T13:00:00Z")),
      true,
    );
    assertEquals(
      adminEditIsNewest(edited, event("2026-10-09T15:00:00Z")),
      false,
    );
    assertEquals(
      adminEditIsNewest(row(), event("2026-10-09T09:00:00Z")),
      false,
    );
  },
);

Deno.test("the location written for a row", () => {
  assertEquals(locationFromRow(row()), "Nordheim");
  assertEquals(
    locationFromRow(
      row({ place: "Chez Marie", address: "3 rue des Lilas, 67520 Nordheim" }),
    ),
    "Chez Marie, 3 rue des Lilas, 67520 Nordheim",
  );
  assertEquals(
    locationFromRow(
      row({
        place: "Conservatoire de Strasbourg",
        address:
          "Conservatoire de Strasbourg, 1 place Dauphine, 67000 Strasbourg",
        room: "Salle 12",
      }),
    ),
    "Conservatoire de Strasbourg, 1 place Dauphine, 67000 Strasbourg, Salle 12",
  );
  // The placeholder is never written into a calendar.
  assertEquals(locationFromRow(row({ place: "À confirmer" })), "");
});

Deno.test(
  "a known place's row says exactly what the calendar already says",
  () => {
    for (const known of KNOWN_PLACES) {
      const location = locationFromRow(
        row({ place: known.place, address: known.address }),
      );
      assertEquals(sameLocation(location, known.address), true, known.id);
    }
  },
);

Deno.test("locations are compared without case, accents or spacing", () => {
  assertEquals(
    sameLocation("Salle des fêtes,  Wangen ", "salle des fetes, wangen"),
    true,
  );
  assertEquals(sameLocation("Wangen", "Nordheim"), false);
});
