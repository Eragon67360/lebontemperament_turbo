import assert from "node:assert/strict";
import {
  concertMetaFr,
  countdownFr,
  daysUntil,
  pickNextConcert,
  siteConcertsUrl,
} from "./nextConcert";

// Wednesday 7 October 2026, 21:00 local time.
const now = new Date(2026, 9, 7, 21, 0, 0);

const concerts = [
  { id: "past", name: "Passé", date: "2026-10-01", time: "20:00:00" },
  { id: "far", name: "Lointain", date: "2027-02-01", time: "20:00:00" },
  {
    id: "nov",
    name: "Entre terre et ciel",
    date: "2026-11-15",
    time: "20:30:00",
  },
  // Dated today at 20:00: an hour ago, but still today's concert.
  { id: "today", name: "Ce soir", date: "2026-10-07", time: "20:00:00" },
];

// --- Which concert is next (local day, not the clock time) ---
assert.equal(pickNextConcert(concerts, now)?.id, "today");
assert.equal(pickNextConcert(concerts.slice(0, 3), now)?.id, "nov");
assert.equal(pickNextConcert([concerts[0]!], now), null);
assert.equal(pickNextConcert([], now), null);
assert.equal(pickNextConcert(undefined, now), null);

// --- Days left ---
assert.equal(daysUntil("2026-10-07", now), 0);
assert.equal(daysUntil("2026-10-08", now), 1);
assert.equal(daysUntil("2026-11-15", now), 39);
assert.equal(daysUntil("2026-10-06", now), -1);
assert.equal(daysUntil("bientôt", now), null);
// Across the end of summer time (25 October 2026): still whole days.
assert.equal(daysUntil("2026-10-26", new Date(2026, 9, 24, 23, 30)), 2);
// Just after midnight, the day has turned.
assert.equal(daysUntil("2026-10-08", new Date(2026, 9, 8, 0, 5)), 0);

// --- The countdown sentence ---
assert.equal(countdownFr(0, "Ce soir"), "C’est aujourd’hui : « Ce soir ».");
assert.equal(countdownFr(1, "Demain"), "C’est demain : « Demain ».");
assert.equal(
  countdownFr(39, "Entre terre et ciel"),
  "Plus que 39 jours avant « Entre terre et ciel ».",
);
assert.equal(countdownFr(-2, "Passé"), null);
assert.equal(countdownFr(null, "Sans date"), null);

// --- The card's meta lines ---
assert.deepEqual(
  concertMetaFr(
    {
      id: "c1",
      name: "Entre terre et ciel",
      date: "2026-11-15",
      time: "20:30:00",
      place: "Église Saint-Paul",
      context: "orchestre_et_choeur",
      is_free: true,
      price: null,
    },
    now,
  ),
  {
    when: "Dimanche 15 novembre · 20 h 30 · Église Saint-Paul",
    details: "Orchestre et chœur · Entrée libre",
  },
);
{
  const meta = concertMetaFr(
    {
      id: "c2",
      date: "2027-01-09",
      time: "17:00",
      place: "Temple Neuf",
      context: "choeur",
      is_free: false,
      price: 15,
    },
    now,
  );
  assert.equal(meta.when, "Samedi 9 janvier 2027 · 17 h · Temple Neuf");
  // Intl puts a narrow no-break space before the euro sign.
  assert.match(meta.details ?? "", /^Chœur · Plein tarif 15\s€$/);
}
// « Autre » and an unknown entry say nothing: no second line.
assert.equal(
  concertMetaFr(
    {
      id: "c3",
      date: "2026-12-12",
      time: "",
      place: "Strasbourg",
      context: "autre",
      is_free: null,
      price: null,
    },
    now,
  ).details,
  null,
);
assert.equal(
  concertMetaFr({ id: "c4", date: "2026-12-12", time: "", place: "Ici" }, now)
    .when,
  "Samedi 12 décembre · Ici",
);

// --- « Voir sur le site » ---
assert.equal(
  siteConcertsUrl("https://www.example.com/"),
  "https://www.example.com/concerts",
);
assert.equal(
  siteConcertsUrl("http://localhost:3000"),
  "http://localhost:3000/concerts",
);
assert.equal(siteConcertsUrl(""), "https://www.lebontemperament.com/concerts");

console.log("utils/home/nextConcert.test.ts: ok");
