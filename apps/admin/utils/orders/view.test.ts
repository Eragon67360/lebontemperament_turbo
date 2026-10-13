// What the sale page computes: rows of buyers, the search (accents and case
// ignored) and the filters, the sentences, the CSV export. Fake data only.
import assert from "node:assert/strict";
import type { SaleDetail, SaleOrder, SaleProduct } from "./types";
import {
  BALANCE_TONES,
  csvFilename,
  csvText,
  deliverableCount,
  deliveryResultLine,
  filterBuyers,
  formatDayFr,
  NO_BUYER_FILTERS,
  normalizeText,
  orderCountLine,
  saleCsvRows,
  saleDatesLine,
  saleView,
  slugify,
  todayParisIso,
} from "./view";

const SALE_ID = "11111111-1111-4111-8111-111111111111";
const P = (n: number) =>
  `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
const O = (n: number) =>
  `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;

const product = (
  n: number,
  fields: Partial<SaleProduct> & Pick<SaleProduct, "name" | "unit_price_cents">,
): SaleProduct => ({
  id: P(n),
  sale_id: SALE_ID,
  category: "Fromages",
  variant: null,
  supplier: "Fruitière TEST",
  display_order: n * 10,
  is_available: true,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  ...fields,
});

const order = (
  n: number,
  fields: Partial<SaleOrder> & Pick<SaleOrder, "buyer_name" | "items">,
): SaleOrder => ({
  id: O(n),
  sale_id: SALE_ID,
  buyer_phone: null,
  buyer_address: null,
  sold_by: null,
  fulfilment: "delivery",
  notes: null,
  delivery_recipient_id: null,
  handed_over_at: null,
  personal_data_erased_at: null,
  created_by: null,
  created_at: "2026-10-02T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z",
  payments: [],
  ...fields,
});

const payment = (amount: number, method = "cash") => ({
  id: `cccccccc-cccc-4ccc-8ccc-${String(amount).padStart(12, "0")}`,
  order_id: O(1),
  amount_cents: amount,
  method,
  paid_on: "2026-10-03",
  note: null,
  recorded_by: null,
  created_at: "2026-10-03T00:00:00Z",
});

const detail: SaleDetail = {
  sale: {
    id: SALE_ID,
    title: "Fromages et saucissons · novembre 2026",
    order_deadline: "2026-11-13",
    delivery_date: "2026-11-27",
    archived_at: null,
    created_by: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
  products: [
    product(1, { name: "Comté", variant: "500 g", unit_price_cents: 1100 }),
    product(2, {
      name: "Saucisson",
      variant: "Noix",
      category: "Saucissons",
      supplier: "Salaison TEST",
      unit_price_cents: 400,
    }),
    product(3, {
      name: "Raclette",
      unit_price_cents: 900,
      is_available: false,
    }),
  ],
  orders: [
    order(1, {
      buyer_name: "Léa TEST",
      buyer_phone: "06 12 34 56 78",
      buyer_address: "1 rue de l'Exemple, 67000 Strasbourg",
      sold_by: "dddddddd-dddd-4ddd-8ddd-000000000001",
      items: [
        { product_id: P(1), quantity: 2 },
        { product_id: P(2), quantity: 3 },
      ],
      payments: [payment(2000, "transfer")],
    }),
    order(2, {
      buyer_name: "marc test",
      fulfilment: "pickup",
      items: [{ product_id: P(2), quantity: 1 }],
      payments: [payment(400)],
      handed_over_at: "2026-11-27T10:00:00Z",
    }),
    order(3, {
      buyer_name: "Émile TEST",
      buyer_address: "",
      items: [{ product_id: P(1), quantity: 1 }],
      delivery_recipient_id: null,
    }),
    order(4, {
      buyer_name: "Zoé TEST",
      buyer_address: "2 rue du Test, 67000 Strasbourg",
      items: [{ product_id: P(3), quantity: 1 }],
      payments: [payment(1000)],
      delivery_recipient_id: "eeeeeeee-eeee-4eee-8eee-000000000001",
    }),
  ],
  sellers: { "dddddddd-dddd-4ddd-8ddd-000000000001": "Camille ROTH" },
};

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
assert.equal(
  csvFilename("Vente d'été — 2027 !"),
  "commandes-vente-d-ete-2027.csv",
);
assert.equal(csvFilename("  ·  "), "commandes-vente.csv");

const csvRows = saleCsvRows(detail);
assert.deepEqual(csvRows[0]!.slice(0, 5), [
  "Acheteur",
  "Téléphone",
  "Adresse",
  "Vendu par",
  "Mode",
]);
// Ordered products only (Comté, Saucisson, Raclette), in the catalogue's order.
assert.deepEqual(csvRows[0]!.slice(5, 8), [
  "Comté · 500 g",
  "Saucisson · Noix",
  "Raclette",
]);
const leaRow = csvRows.find((r) => r[0] === "Léa TEST")!;
assert.deepEqual(leaRow.slice(1, 5), [
  "06 12 34 56 78",
  "1 rue de l'Exemple, 67000 Strasbourg",
  "Camille ROTH",
  "Livraison",
]);
assert.deepEqual(leaRow.slice(5), [
  "2",
  "3",
  "",
  "34,00",
  "20,00",
  "14,00",
  "Paiement partiel",
]);
assert.equal(csvRows.at(-1)![0], "Total");

const text = csvText([
  ["Acheteur", "Adresse"],
  ["Léa TEST", "1 rue de l'Exemple; 67000"],
]);
assert.ok(text.startsWith("﻿"), "UTF-8 BOM for Excel");
assert.equal(
  text.slice(1),
  'Acheteur;Adresse\r\nLéa TEST;"1 rue de l\'Exemple; 67000"\r\n',
);

console.log("orders/view: all assertions passed");
