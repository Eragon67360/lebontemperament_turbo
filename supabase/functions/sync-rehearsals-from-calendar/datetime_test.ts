import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import {
  addDays,
  getParisToday,
  isAllDayEvent,
  parseAllDayDate,
  parseParisDateTimes,
} from "./datetime.ts";

Deno.test("getParisToday uses the Paris calendar day, not UTC", () => {
  // 23:30 UTC on 1 July is already 2 July in Paris (UTC+2).
  assertEquals(getParisToday(new Date("2026-07-01T23:30:00Z")), "2026-07-02");
  // 23:30 UTC on 1 January is already 2 January in Paris (UTC+1).
  assertEquals(getParisToday(new Date("2026-01-01T23:30:00Z")), "2026-01-02");
  assertEquals(getParisToday(new Date("2026-07-01T12:00:00Z")), "2026-07-01");
});

Deno.test("addDays adds whole 24h days", () => {
  assertEquals(
    addDays(new Date("2026-03-01T00:00:00Z"), 60).toISOString(),
    "2026-04-30T00:00:00.000Z",
  );
});

Deno.test("isAllDayEvent", () => {
  assertEquals(isAllDayEvent({ date: "2026-11-08" }), true);
  assertEquals(isAllDayEvent({ dateTime: "2026-11-08T10:00:00+01:00" }), false);
  assertEquals(isAllDayEvent(undefined), false);
});

Deno.test("parseAllDayDate validates the format", () => {
  assertEquals(parseAllDayDate({ date: "2026-11-08" }), "2026-11-08");
  assertThrows(() => parseAllDayDate(undefined));
  assertThrows(() => parseAllDayDate({ date: "08/11/2026" }));
});

Deno.test("parseParisDateTimes: winter time (UTC+1) from a UTC input", () => {
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-01-15T19:00:00Z" },
      { dateTime: "2026-01-15T21:30:00Z" },
    ),
    { date: "2026-01-15", start_time: "20:00", end_time: "22:30" },
  );
});

Deno.test("parseParisDateTimes: summer time (UTC+2)", () => {
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-06-10T20:00:00+02:00" },
      { dateTime: "2026-06-10T22:30:00+02:00" },
    ),
    { date: "2026-06-10", start_time: "20:00", end_time: "22:30" },
  );
});

Deno.test("parseParisDateTimes: offset from another zone is converted", () => {
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-06-10T14:00:00-04:00" },
      { dateTime: "2026-06-10T16:00:00-04:00" },
    ),
    { date: "2026-06-10", start_time: "20:00", end_time: "22:00" },
  );
});

Deno.test("parseParisDateTimes: late evening crosses UTC midnight", () => {
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-07-04T22:30:00Z" },
      { dateTime: "2026-07-04T23:30:00Z" },
    ),
    { date: "2026-07-05", start_time: "00:30", end_time: "01:30" },
  );
});

Deno.test("parseParisDateTimes: spring-forward day (29 March 2026)", () => {
  // 02:00 Paris time jumps to 03:00; 00:30Z is 01:30 CET, 01:30Z is 03:30 CEST.
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-03-29T00:30:00Z" },
      { dateTime: "2026-03-29T01:30:00Z" },
    ),
    { date: "2026-03-29", start_time: "01:30", end_time: "03:30" },
  );
  // A morning rehearsal on that day is already in summer time.
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-03-29T10:00:00+02:00" },
      { dateTime: "2026-03-29T12:00:00+02:00" },
    ),
    { date: "2026-03-29", start_time: "10:00", end_time: "12:00" },
  );
});

Deno.test("parseParisDateTimes: fall-back day (25 October 2026)", () => {
  // 03:00 CEST becomes 02:00 CET; 00:30Z = 02:30 CEST, 01:30Z = 02:30 CET.
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-10-25T00:30:00Z" },
      { dateTime: "2026-10-25T01:30:00Z" },
    ),
    { date: "2026-10-25", start_time: "02:30", end_time: "02:30" },
  );
  assertEquals(
    parseParisDateTimes(
      { dateTime: "2026-10-25T09:30:00+01:00" },
      { dateTime: "2026-10-25T16:00:00+01:00" },
    ),
    { date: "2026-10-25", start_time: "09:30", end_time: "16:00" },
  );
});

Deno.test("parseParisDateTimes rejects missing or invalid values", () => {
  assertThrows(() =>
    parseParisDateTimes(undefined, { dateTime: "2026-01-01T10:00:00Z" }),
  );
  assertThrows(() =>
    parseParisDateTimes({ date: "2026-01-01" }, { date: "2026-01-02" }),
  );
  assertThrows(() =>
    parseParisDateTimes(
      { dateTime: "not a date" },
      { dateTime: "2026-01-01T10:00:00Z" },
    ),
  );
});
