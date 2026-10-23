import assert from "node:assert/strict";
import {
  currentMemberOrder,
  memberOrderFigures,
  memberOrderStage,
  parseMemberOrders,
} from "./memberOrders";

const raw = [
  {
    id: "o-2",
    sale_title: "Fromages · mars 2027",
    order_deadline: null,
    delivery_date: "2027-03-20",
    buyer_name: "Léa TEST",
    buyer_address: null,
    fulfilment: "pickup",
    handed_over_at: null,
    in_round: false,
    delivered_at: null,
    tracking_token: null,
    created_at: "2027-02-01T10:00:00Z",
    items: [],
    payments: [],
    document: null,
  },
  {
    id: "o-1",
    sale_title: "Fromages et saucissons · novembre 2026",
    order_deadline: "2026-11-13",
    delivery_date: "2026-11-27",
    buyer_name: "Léa TEST",
    buyer_address: "1 rue de l'Exemple 67000 Strasbourg",
    fulfilment: "delivery",
    handed_over_at: null,
    in_round: true,
    delivered_at: null,
    tracking_token: "tok",
    created_at: "2026-10-22T10:00:00Z",
    items: [
      {
        product_id: "p-2",
        category: "Saucissons",
        name: "Saucisson",
        variant: "Noix",
        unit_price_cents: 400,
        display_order: 230,
        quantity: 3,
      },
      {
        product_id: "p-1",
        category: "Fromages et charcuterie",
        name: "Comté fruité (9/10 mois)",
        variant: "500 g",
        unit_price_cents: 1100,
        display_order: 10,
        quantity: 1,
      },
      { product_id: "bad" },
    ],
    payments: [
      { amount_cents: 1000, method: "transfer", paid_on: "2026-10-23" },
      { amount_cents: 500, method: "carrier pigeon", paid_on: "2026-10-24" },
    ],
    document: {
      key: "o-1/abc-bon.pdf",
      name: "bon.pdf",
      mime_type: "application/pdf",
      size_bytes: 1200,
    },
  },
  { id: "broken" },
  "nonsense",
];

const orders = parseMemberOrders(raw);
assert.equal(orders.length, 2, "malformed entries skipped");
assert.deepEqual(parseMemberOrders(null), []);
assert.deepEqual(parseMemberOrders({}), []);

const [later, november] = orders;
assert.equal(november!.items.length, 2, "malformed item skipped");
assert.equal(
  november!.payments[1]!.method,
  null,
  "unknown method kept as null",
);
assert.equal(november!.document?.sizeBytes, 1200);
assert.equal(later!.fulfilment, "pickup");

const figures = memberOrderFigures(november!);
assert.deepEqual(
  figures.groups.map((g) => g.category),
  ["Fromages et charcuterie", "Saucissons"],
  "catalogue order",
);
assert.equal(figures.groups[1]!.lines[0]!.label, "Saucisson · Noix");
assert.equal(figures.groups[1]!.lines[0]!.amountCents, 1200);
assert.equal(figures.articleCount, 4);
assert.equal(figures.totalCents, 2300);
assert.equal(figures.paidCents, 1500);
assert.equal(figures.dueCents, 800);
assert.equal(figures.status, "partial");
assert.equal(figures.stage, "in_round");

assert.equal(memberOrderStage({ ...november!, inRound: false }), "received");
assert.equal(
  memberOrderStage({ ...november!, handedOverAt: "2026-11-27T10:00:00Z" }),
  "handed_over",
);
assert.equal(
  memberOrderStage({ ...november!, deliveredAt: "2026-11-27T10:00:00Z" }),
  "delivered",
);
assert.equal(memberOrderFigures(later!).status, "empty");

// The home shows the soonest order still to come.
assert.equal(currentMemberOrder(orders)?.id, "o-1");
assert.equal(
  currentMemberOrder([
    later!,
    { ...november!, deliveredAt: "2026-11-27T10:00:00Z" },
  ])?.id,
  "o-2",
);
assert.equal(
  currentMemberOrder([{ ...november!, handedOverAt: "2026-11-27T10:00:00Z" }]),
  null,
);

console.log("memberOrders: ok");
