// « Ajouter à la tournée »: which round the buyers would join (the rule of
// add_sale_orders_to_delivery), when it looks forgotten, and the sentences the
// dialog shows. Fake data only.
import assert from "node:assert/strict";
import {
  currentRound,
  isOldRound,
  offersNewRound,
  oldRoundWarning,
  roundDay,
  roundLine,
} from "./round";
import type { DriverRound, RoundRow, RoundStop } from "./types";

// Tuesday 20 October 2026, noon in Paris.
const NOW = new Date("2026-10-20T10:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const R = (n: number) =>
  `eeeeeeee-eeee-4eee-8eee-${String(n).padStart(12, "0")}`;
const latest = (fields: Partial<RoundRow> = {}): RoundRow => ({
  created_at: "2026-10-19T08:00:00Z",
  scheduled_at: null,
  scheduled_end_at: null,
  ...fields,
});
const stop = (n: number, fields: Partial<RoundStop> = {}): RoundStop => ({
  id: R(n),
  sort_order: n,
  delivered_at: null,
  ...fields,
});
const DONE = "2026-10-19T15:00:00Z";
const titles = new Map([
  [R(1), "Vente de test"],
  [R(2), "Vente de test"],
  [R(3), "Autre vente de test"],
]);
const round = (fields: Partial<DriverRound> = {}): DriverRound => ({
  opened_at: "2026-10-19T08:00:00Z",
  scheduled_at: null,
  scheduled_end_at: null,
  stops: 4,
  delivered: 1,
  sales: ["Vente de test"],
  ...fields,
});

// --- The current round: the latest one, unless it is finished ---
assert.equal(currentRound(null, [], titles), null); // the driver has no round
assert.deepEqual(currentRound(latest(), [], titles), {
  opened_at: "2026-10-19T08:00:00Z",
  scheduled_at: null,
  scheduled_end_at: null,
  stops: 0,
  delivered: 0,
  sales: [],
}); // an empty round IS the current one
assert.equal(
  currentRound(
    latest(),
    [stop(1, { delivered_at: DONE }), stop(2, { delivered_at: DONE })],
    titles,
  ),
  null,
); // every stop delivered: finished, a new round is opened
assert.equal(
  currentRound(latest(), [stop(1, { delivered_at: DONE })], titles),
  null,
);
const planned = latest({
  scheduled_at: "2026-10-21T13:00:00Z",
  scheduled_end_at: "2026-10-21T16:00:00Z",
});
assert.deepEqual(
  currentRound(
    planned,
    [stop(1, { delivered_at: DONE }), stop(2), stop(3)],
    titles,
  ),
  {
    opened_at: "2026-10-19T08:00:00Z",
    scheduled_at: "2026-10-21T13:00:00Z",
    scheduled_end_at: "2026-10-21T16:00:00Z",
    stops: 3,
    delivered: 1,
    sales: ["Vente de test", "Autre vente de test"],
  },
);
// One stop left is enough to keep the round open.
assert.equal(
  currentRound(latest(), [stop(1, { delivered_at: DONE }), stop(2)], titles)
    ?.delivered,
  1,
);

// The sales: distinct, trimmed, in the stops' order (not the order given),
// without the stops whose sale is unknown or blank.
{
  const mixed = [
    stop(3, { sort_order: 30 }),
    stop(1, { sort_order: 10 }),
    stop(4, { sort_order: 15 }), // no title known
    stop(5, { sort_order: 20 }), // blank title
    stop(2, { sort_order: 25 }), // the first sale again, padded
  ];
  const named = new Map<string, string>([
    ...titles,
    [R(5), "   "],
    [R(2), "  Vente de test "],
  ]);
  const given = mixed.map((s) => s.id);
  assert.deepEqual(currentRound(latest(), mixed, named)?.sales, [
    "Vente de test",
    "Autre vente de test",
  ]);
  assert.deepEqual(
    mixed.map((s) => s.id),
    given,
  ); // the stops it was given are left as they were
}
assert.deepEqual(currentRound(latest(), [stop(9)], titles)?.sales, []);

// A round that cannot be dated is unknown, not « none ».
assert.equal(
  currentRound(latest({ created_at: null }), [stop(1)], titles),
  undefined,
);

// --- A round that looks forgotten ---
// Fresh: opened yesterday, no créneau.
assert.equal(isOldRound(round(), NOW), false);
// Opened more than 14 days ago, with stops left.
assert.equal(isOldRound(round({ opened_at: ago(14 * DAY) }), NOW), false);
assert.equal(
  isOldRound(round({ opened_at: ago(14 * DAY + 60_000) }), NOW),
  true,
);
// Nothing left to deliver: never old, however old it is.
assert.equal(
  isOldRound(round({ opened_at: ago(60 * DAY), stops: 4, delivered: 4 }), NOW),
  false,
);
assert.equal(
  isOldRound(round({ opened_at: ago(60 * DAY), stops: 0, delivered: 0 }), NOW),
  false,
);
// Its créneau is over for more than a day: the end counts...
assert.equal(isOldRound(round({ scheduled_end_at: ago(DAY) }), NOW), false);
assert.equal(
  isOldRound(round({ scheduled_end_at: ago(DAY + 60_000) }), NOW),
  true,
);
// ...else the start...
assert.equal(isOldRound(round({ scheduled_at: ago(DAY) }), NOW), false);
assert.equal(isOldRound(round({ scheduled_at: ago(DAY + 60_000) }), NOW), true);
// ...and the end wins over the start when both are set.
assert.equal(
  isOldRound(
    round({ scheduled_at: ago(3 * DAY), scheduled_end_at: ago(2 * HOUR) }),
    NOW,
  ),
  false,
);
assert.equal(
  isOldRound(
    round({ scheduled_at: ago(2 * HOUR), scheduled_end_at: ago(3 * DAY) }),
    NOW,
  ),
  true,
);
// A créneau still to come is not late.
assert.equal(
  isOldRound(round({ scheduled_end_at: ago(-2 * DAY) }), NOW),
  false,
);
// Either reason is enough.
assert.equal(
  isOldRound(
    round({ opened_at: ago(20 * DAY), scheduled_end_at: ago(-DAY) }),
    NOW,
  ),
  true,
);

// --- A new round is offered when the current one has stops ---
assert.equal(offersNewRound(undefined), false);
assert.equal(offersNewRound(null), false);
assert.equal(
  offersNewRound(round({ stops: 0, delivered: 0, sales: [] })),
  false,
);
assert.equal(offersNewRound(round()), true);

// --- The day: Paris, with the year only when it isn't this year's ---
assert.equal(roundDay("2026-10-19T08:00:00Z", NOW), "lun. 19 oct.");
assert.equal(roundDay("2025-02-21T10:00:00Z", NOW), "21 févr. 2025");
assert.equal(roundDay("2027-01-08T10:00:00Z", NOW), "8 janv. 2027");
// 22:30 UTC is already the next day in Paris (UTC+2 in October)...
assert.equal(roundDay("2026-10-19T22:30:00Z", NOW), "mar. 20 oct.");
// ...and 23:30 UTC on New Year's Eve is already next year there (UTC+1).
assert.equal(
  roundDay("2026-12-31T23:30:00Z", new Date("2027-01-15T10:00:00Z")),
  "ven. 1 janv.",
);
assert.equal(
  roundDay("2026-12-31T22:30:00Z", new Date("2027-01-15T10:00:00Z")),
  "31 déc. 2026",
);
assert.equal(
  roundDay("2026-12-31T10:00:00Z", new Date("2026-12-31T23:30:00Z")),
  "31 déc. 2026",
); // today is already 2027 in Paris, so 2026 shows its year
assert.equal(roundDay("2026-10-19T08:30:00.123456+00:00", NOW), "lun. 19 oct."); // as Postgres writes a timestamp

// --- The note under the select ---
assert.equal(
  roundLine(undefined, NOW),
  "Sa tournée en cours dans l'application, ou une nouvelle.",
); // the round could not be read: today's sentence
assert.equal(
  roundLine(null, NOW),
  "Pas de tournée en cours : une nouvelle sera créée.",
);
assert.equal(
  roundLine(round({ stops: 0, delivered: 0, sales: [] }), NOW),
  "Sa tournée en cours est vide (ouverte le lun. 19 oct.) : les acheteurs y seront ajoutés.",
);
assert.equal(
  roundLine(round(), NOW),
  "Tournée en cours : « Vente de test », ouverte le lun. 19 oct., 4 destinataires, 1 livré. Les acheteurs s'y ajoutent.",
);
// The sales: one, two, more than two, none.
assert.equal(
  roundLine(round({ sales: ["Vente de test", "Autre vente de test"] }), NOW),
  "Tournée en cours : « Vente de test » et « Autre vente de test », ouverte le lun. 19 oct., 4 destinataires, 1 livré. Les acheteurs s'y ajoutent.",
);
assert.equal(
  roundLine(round({ sales: ["Vente A", "Vente B", "Vente C"] }), NOW),
  "Tournée en cours : « Vente A » et 2 autres ventes, ouverte le lun. 19 oct., 4 destinataires, 1 livré. Les acheteurs s'y ajoutent.",
);
assert.equal(
  roundLine(
    round({ sales: ["Vente A", "Vente B", "Vente C", "Vente D"] }),
    NOW,
  ),
  "Tournée en cours : « Vente A » et 3 autres ventes, ouverte le lun. 19 oct., 4 destinataires, 1 livré. Les acheteurs s'y ajoutent.",
);
// Stops all added in the app: no sale to name, the day says which round.
assert.equal(
  roundLine(round({ sales: [] }), NOW),
  "Tournée en cours : ouverte le lun. 19 oct., 4 destinataires, 1 livré. Les acheteurs s'y ajoutent.",
);
// « Nouvelle tournée » ticked: the round is described, the buyers go elsewhere.
assert.equal(
  roundLine(round(), NOW, true),
  "Tournée en cours : « Vente de test », ouverte le lun. 19 oct., 4 destinataires, 1 livré. Les acheteurs iront dans une nouvelle tournée.",
);
// The progress: singular under 2, « aucun », « tous ».
const progress = (stops: number, delivered: number) =>
  roundLine(round({ stops, delivered }), NOW)
    .replace(/^.*ouverte le lun\. 19 oct\., /, "")
    .replace(/\. Les acheteurs s'y ajoutent\.$/, "");
assert.equal(progress(1, 0), "1 destinataire, aucun livré");
assert.equal(progress(4, 0), "4 destinataires, aucun livré");
assert.equal(progress(4, 1), "4 destinataires, 1 livré");
assert.equal(progress(4, 2), "4 destinataires, 2 livrés");
assert.equal(progress(4, 3), "4 destinataires, 3 livrés");
assert.equal(progress(3, 3), "3 destinataires, tous livrés");
assert.equal(progress(1, 1), "1 destinataire, livré");
// The year when the round was opened in another one.
assert.equal(
  roundLine(round({ opened_at: "2025-02-21T10:00:00Z" }), NOW),
  "Tournée en cours : « Vente de test », ouverte le 21 févr. 2025, 4 destinataires, 1 livré. Les acheteurs s'y ajoutent.",
);
assert.equal(
  roundLine(
    round({ opened_at: "2025-02-21T10:00:00Z", stops: 0, delivered: 0 }),
    NOW,
  ),
  "Sa tournée en cours est vide (ouverte le 21 févr. 2025) : les acheteurs y seront ajoutés.",
);

// --- The warning under it ---
assert.equal(
  oldRoundWarning(
    round({ opened_at: "2026-10-05T08:00:00Z", delivered: 1 }),
    NOW,
  ),
  "Elle date du lun. 5 oct. et a encore 3 destinataires non livrés. Pour une autre livraison, cochez « Nouvelle tournée ».",
);
assert.equal(
  oldRoundWarning(
    round({ opened_at: "2026-10-05T08:00:00Z", delivered: 3 }),
    NOW,
  ),
  "Elle date du lun. 5 oct. et a encore 1 destinataire non livré. Pour une autre livraison, cochez « Nouvelle tournée ».",
);
assert.equal(
  oldRoundWarning(
    round({ opened_at: "2025-12-18T08:00:00Z", stops: 2, delivered: 0 }),
    NOW,
  ),
  "Elle date du 18 déc. 2025 et a encore 2 destinataires non livrés. Pour une autre livraison, cochez « Nouvelle tournée ».",
);

console.log("orders/round: all assertions passed");
