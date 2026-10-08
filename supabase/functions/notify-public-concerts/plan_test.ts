// Run: npx -y deno test --node-modules-dir=none supabase/functions/notify-public-concerts/
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type ConcertRow,
  daysBetween,
  frenchTime,
  MAX_PUSHES_PER_RUN,
  parisToday,
  plan,
} from "./plan.ts";

const TODAY = "2026-11-10"; // a Tuesday

function concert(id: string, date: string, extra: Partial<ConcertRow> = {}) {
  return {
    id,
    name: `Concert ${id}`,
    date,
    time: "20:00:00",
    place: "Église, Saverne",
    venue_name: null,
    city: null,
    ...extra,
  } satisfies ConcertRow;
}

Deno.test("a new concert far away is announced once", () => {
  const c = concert("a", "2026-12-05");
  const first = plan([c], new Set(), TODAY);
  assertEquals(
    first.map((p) => p.kind),
    ["announcement"],
  );
  assertEquals(first[0].title, "Nouveau concert : Concert a");
  assertEquals(
    first[0].body,
    "Samedi 5 décembre à 20 h, Église, Saverne. Notez la date, on compte sur vous !",
  );
  assertEquals(plan([c], new Set(["a:announcement"]), TODAY), []);
});

Deno.test("two days before, the reminder goes out once", () => {
  const c = concert("b", "2026-11-12", {
    venue_name: "Église Saint-Martin",
    city: "Saverne",
    time: "17:30",
  });
  const due = plan([c], new Set(["b:announcement"]), TODAY);
  assertEquals(
    due.map((p) => p.kind),
    ["reminder"],
  );
  assertEquals(due[0].title, "Concert b, c’est après-demain !");
  assertEquals(
    due[0].body,
    "Jeudi 12 novembre à 17 h 30, Église Saint-Martin, Saverne. On vous attend !",
  );
  assertEquals(plan([c], new Set(["b:announcement", "b:reminder"]), TODAY), []);
});

Deno.test("a concert created the day before gets the reminder only", () => {
  const due = plan([concert("c", "2026-11-11")], new Set(), TODAY);
  assertEquals(
    due.map((p) => p.kind),
    ["reminder"],
  );
  assertEquals(due[0].title, "Concert c, c’est demain !");
});

Deno.test("past, same-day and undated concerts get nothing", () => {
  const due = plan(
    [
      concert("past", "2026-11-01"),
      concert("today", TODAY),
      concert("odd", "bientôt"),
    ],
    new Set(),
    TODAY,
  );
  assertEquals(due, []);
});

Deno.test("never more than the daily cap, soonest first", () => {
  const concerts = ["2027-03-01", "2026-12-01", "2027-01-01", "2027-02-01"].map(
    (d, i) => concert(`${i}`, d),
  );
  const due = plan(concerts, new Set(), TODAY);
  assertEquals(due.length, MAX_PUSHES_PER_RUN);
  assertEquals(
    due.map((p) => p.concert.date),
    ["2026-12-01", "2027-01-01", "2027-02-01"],
  );
});

Deno.test("an unnamed concert without a time still reads well", () => {
  const due = plan(
    [concert("d", "2026-12-05", { name: null, time: null, place: "" })],
    new Set(),
    TODAY,
  );
  assertEquals(due[0].title, "Nouveau concert : Notre concert");
  assertEquals(
    due[0].body,
    "Samedi 5 décembre. Notez la date, on compte sur vous !",
  );
});

Deno.test("dates are counted in Paris", () => {
  // 23:30 UTC on 10 November is already 11 November in Paris.
  assertEquals(parisToday(new Date("2026-11-10T23:30:00Z")), "2026-11-11");
  assertEquals(daysBetween("2026-10-24", "2026-10-26"), 2); // across DST end
  assertEquals(frenchTime("09:05:00"), "9 h 05");
});
