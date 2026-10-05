import assert from "node:assert/strict";
import {
  concertCountLabel,
  concertTitle,
  contextLabel,
  excerpt,
  formatLongDateFr,
  formatTimeFr,
  isUpcomingTour,
  splitConcerts,
  splitTours,
  todayIso,
  tourPeriodLabel,
} from "./schedule";

// --- todayIso: the local day, not the UTC one ---
// 00:30 local on the 4th: UTC may still be the 3rd west of Greenwich, or
// already the 4th east of it; the admin's calendar says the 4th either way.
assert.equal(todayIso(new Date(2026, 9, 4, 0, 30)), "2026-10-04");
assert.equal(todayIso(new Date(2026, 0, 1, 23, 59)), "2026-01-01");

// --- Concerts: today stays upcoming; upcoming soonest first, past most recent first ---
{
  const concert = (id: string, date: string, time = "20:00:00") => ({
    id,
    date,
    time,
  });
  const { upcoming, past } = splitConcerts(
    [
      concert("late", "2026-12-01"),
      concert("yesterday", "2026-10-03"),
      concert("today-evening", "2026-10-04", "20:30:00"),
      concert("today-noon", "2026-10-04", "12:00:00"),
      concert("old", "2025-06-15"),
      concert("soon", "2026-10-10"),
    ],
    "2026-10-04",
  );
  assert.deepEqual(
    upcoming.map((c) => c.id),
    ["today-noon", "today-evening", "soon", "late"],
  );
  assert.deepEqual(
    past.map((c) => c.id),
    ["yesterday", "old"],
  );
}

// --- Tours: undated stays upcoming; only a start date counts as the last day ---
{
  const today = "2026-10-04";
  assert.equal(
    isUpcomingTour({ id: "t", name: "Sans dates" }, today),
    true,
    "a tour without dates must not disappear",
  );
  assert.equal(
    isUpcomingTour(
      {
        id: "t",
        name: "Été",
        start_date: "2026-08-13",
        end_date: "2026-09-20",
      },
      today,
    ),
    false,
  );
  assert.equal(
    isUpcomingTour(
      {
        id: "t",
        name: "Dernier jour",
        start_date: "2026-09-01",
        end_date: today,
      },
      today,
    ),
    true,
  );
  assert.equal(
    isUpcomingTour(
      { id: "t", name: "Départ seul", start_date: "2026-10-03" },
      today,
    ),
    false,
  );
  assert.equal(
    isUpcomingTour(
      { id: "t", name: "Départ seul", start_date: "2026-10-05" },
      today,
    ),
    true,
  );

  const { upcoming, past } = splitTours(
    [
      { id: "b", name: "B", start_date: "2026-11-01", end_date: "2026-11-10" },
      { id: "undated", name: "U" },
      {
        id: "old",
        name: "O",
        start_date: "2025-08-14",
        end_date: "2025-09-28",
      },
      { id: "a", name: "A", start_date: "2026-10-20" },
      {
        id: "older",
        name: "OO",
        start_date: "2024-05-01",
        end_date: "2024-05-03",
      },
    ],
    today,
  );
  assert.deepEqual(
    upcoming.map((t) => t.id),
    ["undated", "a", "b"],
  );
  assert.deepEqual(
    past.map((t) => t.id),
    ["old", "older"],
  );
}

// --- Wording ---
assert.equal(contextLabel("orchestre_et_choeur"), "Orchestre et chœur");
assert.equal(contextLabel("choeur"), "Chœur");
assert.equal(contextLabel(null), "Autre");
assert.equal(contextLabel("mystery"), "Autre");

assert.equal(
  concertTitle({ name: "Entre terre et ciel" }),
  "Entre terre et ciel",
);
assert.equal(
  concertTitle({ name: "", place: "Strasbourg" }),
  "Concert à Strasbourg",
);
assert.equal(concertTitle({}), "Concert sans titre");

assert.equal(formatLongDateFr("2026-09-15"), "Mardi 15 septembre 2026");
assert.equal(formatTimeFr("20:30:00"), "20 h 30");
assert.equal(formatTimeFr("20:00"), "20 h");
assert.equal(formatTimeFr(""), "");

assert.equal(
  tourPeriodLabel({
    id: "t",
    name: "T",
    start_date: "2025-08-14",
    end_date: "2025-09-28",
  }),
  "Du 14 août 2025 au 28 sept. 2025",
);
assert.equal(
  tourPeriodLabel({ id: "t", name: "T", start_date: "2025-08-14" }),
  "À partir du 14 août 2025",
);
assert.equal(
  tourPeriodLabel({ id: "t", name: "T", end_date: "2025-08-14" }),
  "Jusqu'au 14 août 2025",
);
assert.equal(
  tourPeriodLabel({
    id: "t",
    name: "T",
    start_date: "2025-08-14",
    end_date: "2025-08-14",
  }),
  "Le 14 août 2025",
);
assert.equal(tourPeriodLabel({ id: "t", name: "T" }), "Dates à préciser");

assert.equal(concertCountLabel(0), "Aucun concert");
assert.equal(concertCountLabel(1), "1 concert");
assert.equal(concertCountLabel(3), "3 concerts");

assert.equal(
  excerpt("  Entrée libre,\n plateau au profit.  "),
  "Entrée libre, plateau au profit.",
);
assert.equal(excerpt(null), "");
{
  const long = "Entrée libre et plateau au profit de l'association, ".repeat(5);
  const short = excerpt(long, 60);
  assert.ok(short.length <= 61 && short.endsWith("…"), short);
  assert.ok(!short.includes(",…"), "cuts on a word boundary");
}

console.log("concerts/schedule: all assertions passed");
