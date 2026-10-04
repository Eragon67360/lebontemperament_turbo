import assert from "node:assert/strict";
import {
  dateBlockFr,
  formatDayFr,
  formatTimeFr,
  localDateTime,
  mergeUpcoming,
  nextConcert,
  nextRehearsal,
} from "./upcoming";

// Fixed "now": Friday 3 October 2026, 10:00 local time.
const now = new Date(2026, 9, 3, 10, 0, 0);

// --- Dates and times ---
{
  const d = localDateTime("2026-10-07", "20:30:00")!;
  assert.deepEqual(
    [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()],
    [2026, 9, 7, 20, 30],
  );
  // A bare date is local midnight, not UTC midnight.
  assert.equal(localDateTime("2026-10-07")!.getHours(), 0);
  assert.equal(
    localDateTime("2026-10-07", null, { hours: 23, minutes: 59 })!.getHours(),
    23,
  );
  assert.equal(localDateTime("not a date"), null);

  assert.equal(formatTimeFr("20:30:00"), "20 h 30");
  assert.equal(formatTimeFr("20:00"), "20 h");
  assert.equal(formatTimeFr("09:05"), "9 h 05");
  assert.equal(formatTimeFr(""), null);
  assert.equal(formatTimeFr(null), null);

  assert.equal(formatDayFr(new Date(2026, 9, 7), now), "Mercredi 7 octobre");
  assert.equal(formatDayFr(new Date(2027, 0, 9), now), "Samedi 9 janvier 2027");
  assert.deepEqual(dateBlockFr(new Date(2026, 9, 7)), {
    day: "7",
    month: "oct.",
  });
}

const rehearsals = [
  {
    id: "r1",
    name: "Répétition Adultes",
    date: "2026-10-07",
    start_time: "20:00:00",
    end_time: "22:00:00",
    place: "Salle Saint-Thomas",
    group_type: "Choeur complet",
  },
  {
    id: "r-past",
    name: "Répétition passée",
    date: "2026-10-02",
    start_time: "20:00:00",
    end_time: "22:00:00",
    place: "Ailleurs",
  },
  {
    id: "r-today-running",
    name: "Répétition en cours",
    date: "2026-10-03",
    start_time: "09:30:00",
    end_time: "11:00:00",
    place: "Ici",
  },
  {
    id: "r-today-done",
    name: "Répétition finie",
    date: "2026-10-03",
    start_time: "07:00:00",
    end_time: "09:00:00",
    place: "Ici",
  },
  {
    id: "r-far",
    name: "Répétition lointaine",
    date: "2026-12-01",
    start_time: "20:00:00",
    end_time: "22:00:00",
    place: null,
  },
];

const events = [
  {
    id: "e1",
    title: "Assemblée générale",
    date_from: "2026-10-18",
    time: "14:00",
    location: "",
  },
  {
    id: "e-multi",
    title: "Séjour chant",
    date_from: "2026-10-01",
    date_to: "2026-10-04",
    time: "",
    location: "Vosges",
  },
  {
    id: "e-ended",
    title: "Vente passée",
    date_from: "2026-09-20",
    date_to: "2026-09-21",
    time: "10:00",
  },
];

const concerts = [
  {
    id: "c1",
    name: "Entre terre et ciel",
    date: "2026-10-25",
    time: "20:30:00",
    place: "Église Saint-Paul, Strasbourg",
  },
  { id: "c-past", name: "Concert passé", date: "2026-09-01", time: "20:00" },
  { id: "c-far", name: "Concert lointain", date: "2027-01-09", time: "20:00" },
];

// --- The merge: one chronological list over the next 30 days ---
{
  const items = mergeUpcoming({ rehearsals, events, concerts }, { now });
  assert.deepEqual(
    items.map((item) => item.key),
    [
      "event-e-multi", // started before now, ends tonight: still listed
      "rehearsal-r-today-running", // ends after now
      "rehearsal-r1",
      "event-e1",
      "concert-c1",
    ],
  );
  // Past, finished and beyond-the-window items are out.
  for (const gone of [
    "rehearsal-r-past",
    "rehearsal-r-today-done",
    "rehearsal-r-far",
    "event-e-ended",
    "concert-c-past",
    "concert-c-far",
  ]) {
    assert.ok(
      !items.some((item) => item.key === gone),
      `${gone} should not be listed`,
    );
  }

  const r1 = items.find((item) => item.key === "rehearsal-r1")!;
  assert.equal(r1.kind, "rehearsal");
  assert.equal(r1.title, "Répétition Adultes");
  assert.equal(r1.time, "20 h");
  assert.equal(r1.place, "Salle Saint-Thomas");
  assert.equal(r1.href, "/dashboard/members/repetitions");

  const e1 = items.find((item) => item.key === "event-e1")!;
  assert.equal(e1.time, "14 h");
  assert.equal(e1.place, null);
  assert.equal(e1.href, "/dashboard/members/evenements");

  const multi = items.find((item) => item.key === "event-e-multi")!;
  assert.equal(multi.time, null);

  const c1 = items.find((item) => item.key === "concert-c1")!;
  assert.equal(c1.time, "20 h 30");
  assert.equal(c1.href, "/dashboard/public/concerts/prochains-concerts");
}

// The cap and the window are options.
{
  assert.equal(
    mergeUpcoming({ rehearsals, events, concerts }, { now, limit: 2 }).length,
    2,
  );
  const wide = mergeUpcoming(
    { rehearsals, events, concerts },
    { now, days: 120, limit: 20 },
  );
  assert.ok(wide.some((item) => item.key === "concert-c-far"));
  assert.ok(wide.some((item) => item.key === "rehearsal-r-far"));
}

// A missing source (failed query) leaves the others intact.
{
  const items = mergeUpcoming({ rehearsals, concerts }, { now });
  assert.ok(items.every((item) => item.kind !== "event"));
  assert.ok(items.some((item) => item.kind === "concert"));
  assert.deepEqual(mergeUpcoming({}, { now }), []);
}

// Fallback titles when a row has none, and unreadable dates are skipped.
{
  const items = mergeUpcoming(
    {
      rehearsals: [
        {
          id: "r-noname",
          name: "  ",
          date: "2026-10-10",
          start_time: "20:00",
          end_time: "21:00",
          place: null,
          group_type: "Orchestre",
        },
        {
          id: "r-bad",
          name: "Mauvaise date",
          date: "",
          start_time: "20:00",
          end_time: "21:00",
          place: null,
        },
      ],
      concerts: [
        { id: "c-noname", name: null, date: "2026-10-11", time: "20:00" },
      ],
    },
    { now },
  );
  assert.deepEqual(
    items.map((item) => item.title),
    ["Répétition · Orchestre", "Concert sans nom"],
  );
}

// Next concert / rehearsal for the status lines, whatever the window.
{
  assert.equal(nextConcert(concerts, now)!.key, "concert-c1");
  assert.equal(nextConcert([concerts[1]!], now), null);
  assert.equal(nextConcert(undefined, now), null);
  assert.equal(
    nextRehearsal(rehearsals, now)!.key,
    "rehearsal-r-today-running",
  );
}

console.log("utils/home/upcoming.test.ts: ok");
