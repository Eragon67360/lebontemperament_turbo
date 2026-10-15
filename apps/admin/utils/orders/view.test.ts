// What the sale page computes: rows of buyers, the search (accents and case
// ignored) and the filters, the sentences, the export's file name. Fake data only.
import assert from "node:assert/strict";
import { detail } from "./testData";
import {
  BALANCE_TONES,
  deliverableCount,
  deliveryResultLine,
  filterBuyers,
  formatDayFr,
  NO_BUYER_FILTERS,
  normalizeText,
  orderCountLine,
  saleDatesLine,
  saleView,
  slugify,
  todayParisIso,
} from "./view";

// --- Rows: alphabetical, with what the table shows beside the totals ---
const { summary, rows } = saleView(detail);
assert.deepEqual(
  rows.map((r) => r.buyerName),
  ["Émile TEST", "Léa TEST", "marc test", "Zoé TEST"],
);
const lea = rows.find((r) => r.buyerName === "Léa TEST")!;
assert.equal(lea.totalCents, 2 * 1100 + 3 * 400);
assert.equal(lea.paidCents, 2000);
assert.equal(lea.dueCents, 1400);
assert.equal(lea.status, "partial");
assert.equal(lea.soldBy, "Camille ROTH");
assert.equal(lea.inRound, false);
assert.equal(lea.handedOver, false);
const marc = rows.find((r) => r.buyerName === "marc test")!;
assert.equal(marc.status, "paid");
assert.equal(marc.handedOver, true);
assert.equal(marc.soldBy, null);
const zoe = rows.find((r) => r.buyerName === "Zoé TEST")!;
assert.equal(zoe.status, "overpaid");
assert.equal(zoe.inRound, true);
assert.equal(summary.orderCount, 4);
assert.equal(summary.owingCount, 2);
assert.equal(summary.byMethod.transfer, 2000);
assert.equal(summary.byMethod.cash, 1400);

// --- Search: accents and case ignored, phone and seller searchable ---
assert.equal(normalizeText("  Émile Zoé "), "emile zoe");
const search = (query: string) =>
  filterBuyers(rows, { ...NO_BUYER_FILTERS, query }).map((r) => r.buyerName);
assert.deepEqual(search("emile"), ["Émile TEST"]);
assert.deepEqual(search("LÉA"), ["Léa TEST"]);
assert.deepEqual(search("0612"), []);
assert.deepEqual(search("06 12"), ["Léa TEST"]);
assert.deepEqual(search("camille"), ["Léa TEST"]);
assert.deepEqual(search("test").length, 4);
assert.deepEqual(search("personne"), []);

// --- Filters ---
assert.deepEqual(
  filterBuyers(rows, { ...NO_BUYER_FILTERS, state: "owing" }).map(
    (r) => r.buyerName,
  ),
  ["Émile TEST", "Léa TEST"],
);
assert.deepEqual(
  filterBuyers(rows, { ...NO_BUYER_FILTERS, state: "paid" }).map(
    (r) => r.buyerName,
  ),
  ["marc test", "Zoé TEST"],
);
assert.deepEqual(
  filterBuyers(rows, { ...NO_BUYER_FILTERS, mode: "pickup" }).map(
    (r) => r.buyerName,
  ),
  ["marc test"],
);
assert.deepEqual(
  filterBuyers(rows, { query: "test", state: "owing", mode: "delivery" }).map(
    (r) => r.buyerName,
  ),
  ["Émile TEST", "Léa TEST"],
);

// --- Tones: the word carries the meaning, the colour reinforces it ---
assert.equal(BALANCE_TONES.paid, "success");
assert.equal(BALANCE_TONES.partial, "warning");
assert.equal(BALANCE_TONES.unpaid, "danger");
assert.equal(BALANCE_TONES.overpaid, "info");

// --- Sentences ---
const now = new Date(2026, 9, 13);
assert.equal(formatDayFr("2026-11-13", now), "vendredi 13 novembre");
assert.equal(formatDayFr("2027-01-08", now), "vendredi 8 janvier 2027");
assert.equal(
  saleDatesLine(detail.sale, now),
  "Commandes jusqu'au vendredi 13 novembre · livraison le vendredi 27 novembre",
);
assert.equal(
  saleDatesLine({ order_deadline: null, delivery_date: "2026-11-27" }, now),
  "Livraison le vendredi 27 novembre",
);
assert.equal(
  saleDatesLine({ order_deadline: "2026-11-13", delivery_date: null }, now),
  "Commandes jusqu'au vendredi 13 novembre",
);
assert.equal(
  saleDatesLine({ order_deadline: null, delivery_date: null }, now),
  null,
);
assert.equal(orderCountLine(summary), "4 commandes dont 2 à régler");
assert.equal(
  orderCountLine({ orderCount: 0, owingCount: 0 }),
  "Aucune commande",
);
assert.equal(
  orderCountLine({ orderCount: 1, owingCount: 0 }),
  "1 commande, payée",
);
assert.equal(
  orderCountLine({ orderCount: 3, owingCount: 0 }),
  "3 commandes, toutes payées",
);

// --- The round: who would be added ---
assert.deepEqual(deliverableCount(detail.orders), {
  ready: 1, // Léa: delivery, address, no stop yet
  withoutAddress: 1, // Émile
});
assert.equal(
  deliveryResultLine({ added: 12, without_address: 2 }),
  "12 acheteurs ajoutés · 2 sans adresse",
);
assert.equal(
  deliveryResultLine({ added: 1, without_address: 0 }),
  "1 acheteur ajouté",
);
assert.equal(
  deliveryResultLine({ added: 0, without_address: 3 }),
  "Aucun acheteur ajouté · 3 sans adresse",
);

// Paris day, not UTC's: 23:30 UTC on the 13th is already the 14th in Paris.
assert.equal(todayParisIso(new Date("2026-10-13T23:30:00Z")), "2026-10-14");
assert.equal(todayParisIso(new Date("2026-10-13T12:00:00Z")), "2026-10-13");

// --- Export ---
assert.equal(
  slugify("Fromages et saucissons · novembre 2026"),
  "fromages-et-saucissons-novembre-2026",
);
console.log("orders/view: all assertions passed");
