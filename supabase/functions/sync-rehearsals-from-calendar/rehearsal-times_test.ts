import { assertEquals } from "jsr:@std/assert@1";
import { resolveRehearsalTimes } from "./rehearsal-times.ts";
import type { GoogleCalendarEvent } from "./types.ts";

const base = { id: "evt_1", updated: "2026-09-01T10:00:00.000Z" };

Deno.test("timed event uses Paris start and end times", () => {
  const event: GoogleCalendarEvent = {
    ...base,
    summary: "Répétition générale",
    start: { dateTime: "2026-11-05T20:00:00+01:00" },
    end: { dateTime: "2026-11-05T22:30:00+01:00" },
  };
  assertEquals(resolveRehearsalTimes(event), {
    date: "2026-11-05",
    start_time: "20:00",
    end_time: "22:30",
    all_day: false,
  });
});

Deno.test("timed event across a DST change keeps Paris wall-clock time", () => {
  // Fall-back day: 25 October 2026.
  const event: GoogleCalendarEvent = {
    ...base,
    summary: "Répétition",
    start: { dateTime: "2026-10-25T14:00:00+01:00" },
    end: { dateTime: "2026-10-25T17:00:00+01:00" },
  };
  assertEquals(resolveRehearsalTimes(event)?.start_time, "14:00");
  assertEquals(resolveRehearsalTimes(event)?.end_time, "17:00");
});

Deno.test("all-day 'Dimanche BT' gets the default hours", () => {
  const event: GoogleCalendarEvent = {
    ...base,
    summary: "Dimanche BT à Église Saint-Pierre",
    start: { date: "2026-11-08" },
    end: { date: "2026-11-09" },
  };
  assertEquals(resolveRehearsalTimes(event), {
    date: "2026-11-08",
    start_time: "09:30",
    end_time: "16:00",
    all_day: true,
    rule_id: "dimanche_bt",
  });
});

Deno.test("the rule also matches the description, case-insensitively", () => {
  const event: GoogleCalendarEvent = {
    ...base,
    summary: "Journée chœur",
    description: "DIMANCHE   bt, salle paroissiale",
    start: { date: "2026-03-29" },
    end: { date: "2026-03-30" },
  };
  assertEquals(resolveRehearsalTimes(event)?.rule_id, "dimanche_bt");
});

Deno.test("all-day event without a rule resolves to null", () => {
  const event: GoogleCalendarEvent = {
    ...base,
    summary: "Week-end de travail",
    start: { date: "2026-11-14" },
    end: { date: "2026-11-16" },
  };
  assertEquals(resolveRehearsalTimes(event), null);
});
