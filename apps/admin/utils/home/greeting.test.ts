import assert from "node:assert/strict";
import { DEFAULT_INTRO, greetingFr, homeIntroFr } from "./greeting";

// Wednesday 7 October 2026, local time: the greeting follows the admin's own
// clock, wherever the admin is.
const at = (hours: number, minutes = 0) =>
  new Date(2026, 9, 7, hours, minutes, 0);

// --- Bonjour / Bonsoir, on the admin's local clock ---
assert.equal(greetingFr(at(0)), "Bonjour");
assert.equal(greetingFr(at(9)), "Bonjour");
assert.equal(greetingFr(at(17, 59)), "Bonjour");
assert.equal(greetingFr(at(18)), "Bonsoir");
assert.equal(greetingFr(at(23, 30)), "Bonsoir");

// --- The date, then the countdown: Paris days, whatever TZ this runs under ---
// Wednesday 7 October 2026, 12:00 in Paris (10:00 UTC).
const noon = new Date("2026-10-07T10:00:00Z");
const concert = {
  name: "Entre terre et ciel",
  place: "Église Saint-Paul",
  date: "2026-11-15",
};
assert.deepEqual(homeIntroFr(noon, concert), {
  date: "Mercredi 7 octobre.",
  sentence: "Plus que 39 jours avant « Entre terre et ciel ».",
});
assert.equal(
  homeIntroFr(noon, { ...concert, date: "2026-10-08" }).sentence,
  "C’est demain : « Entre terre et ciel ».",
);
assert.equal(
  homeIntroFr(noon, { ...concert, date: "2026-10-09" }).sentence,
  "Plus que 2 jours avant « Entre terre et ciel ».",
);
// A concert tonight at 23:30 in Paris (21:30 UTC, summer time) is still
// « aujourd'hui », whatever UTC or the admin's device says.
assert.equal(
  homeIntroFr(new Date("2026-10-07T21:30:00Z"), {
    ...concert,
    date: "2026-10-07",
  }).sentence,
  "C’est aujourd’hui : « Entre terre et ciel ».",
);
// At 00:30 in Paris (22:30 UTC on the 7th) the day has turned: the date and
// the countdown agree, even where the device's own clock still says the 7th.
assert.deepEqual(
  homeIntroFr(new Date("2026-10-07T22:30:00Z"), {
    ...concert,
    date: "2026-10-08",
  }),
  {
    date: "Jeudi 8 octobre.",
    sentence: "C’est aujourd’hui : « Entre terre et ciel ».",
  },
);
// No name: the site's title, « Concert à {lieu} ».
assert.equal(
  homeIntroFr(noon, { name: null, place: "Colmar", date: "2026-10-08" })
    .sentence,
  "C’est demain : « Concert à Colmar ».",
);

// --- No concert, a past one, or still loading ---
assert.deepEqual(homeIntroFr(noon, null), {
  date: "Mercredi 7 octobre.",
  sentence: DEFAULT_INTRO,
});
assert.equal(
  homeIntroFr(noon, { ...concert, date: "2026-10-01" }).sentence,
  DEFAULT_INTRO,
);
assert.deepEqual(homeIntroFr(noon, undefined), {
  date: "Mercredi 7 octobre.",
  sentence: null,
});

console.log("utils/home/greeting.test.ts: ok");
