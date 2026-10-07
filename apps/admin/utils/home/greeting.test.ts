import assert from "node:assert/strict";
import { DEFAULT_INTRO, greetingFr, homeIntroFr } from "./greeting";

// Wednesday 7 October 2026, local time.
const at = (hours: number, minutes = 0) =>
  new Date(2026, 9, 7, hours, minutes, 0);

// --- Bonjour / Bonsoir, on the admin's local clock ---
assert.equal(greetingFr(at(0)), "Bonjour");
assert.equal(greetingFr(at(9)), "Bonjour");
assert.equal(greetingFr(at(17, 59)), "Bonjour");
assert.equal(greetingFr(at(18)), "Bonsoir");
assert.equal(greetingFr(at(23, 30)), "Bonsoir");

// --- The date, then the countdown ---
const concert = {
  name: "Entre terre et ciel",
  place: "Église Saint-Paul",
  date: "2026-11-15",
};
assert.deepEqual(homeIntroFr(at(10), concert), {
  date: "Mercredi 7 octobre.",
  sentence: "Plus que 39 jours avant « Entre terre et ciel ».",
});
assert.equal(
  homeIntroFr(at(10), { ...concert, date: "2026-10-08" }).sentence,
  "C’est demain : « Entre terre et ciel ».",
);
assert.equal(
  homeIntroFr(at(10), { ...concert, date: "2026-10-09" }).sentence,
  "Plus que 2 jours avant « Entre terre et ciel ».",
);
// A concert tonight at 23:30 local is still « aujourd'hui », whatever UTC says.
assert.equal(
  homeIntroFr(at(23, 30), { ...concert, date: "2026-10-07" }).sentence,
  "C’est aujourd’hui : « Entre terre et ciel ».",
);
// No name: the site's title, « Concert à {lieu} ».
assert.equal(
  homeIntroFr(at(10), { name: null, place: "Colmar", date: "2026-10-08" })
    .sentence,
  "C’est demain : « Concert à Colmar ».",
);

// --- No concert, a past one, or still loading ---
assert.deepEqual(homeIntroFr(at(10), null), {
  date: "Mercredi 7 octobre.",
  sentence: DEFAULT_INTRO,
});
assert.equal(
  homeIntroFr(at(10), { ...concert, date: "2026-10-01" }).sentence,
  DEFAULT_INTRO,
);
assert.deepEqual(homeIntroFr(at(10), undefined), {
  date: "Mercredi 7 octobre.",
  sentence: null,
});

console.log("utils/home/greeting.test.ts: ok");
