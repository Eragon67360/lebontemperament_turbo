// Run with: npx tsx lib/membres/orders.test.ts
// Fake names only: the repository is public.
import {
  memberOrderFigures,
  type MemberOrder,
} from "@repo/domain/utils/memberOrders";
import assert from "node:assert/strict";
import {
  articleCountLabel,
  balanceLine,
  dayLabel,
  handoverLine,
  orderSteps,
  paymentLine,
  stageLabel,
} from "./orders";

const NOW = new Date(2026, 9, 22);
const NBSP = /[\u00a0\u202f]/g;
const plain = (s: string | null) => s?.replace(NBSP, " ") ?? null;

const order: MemberOrder = {
  id: "o-1",
  saleTitle: "Fromages et saucissons · novembre 2026",
  orderDeadline: "2026-11-13",
  deliveryDate: "2026-11-27",
  buyerName: "Léa TEST",
  buyerAddress: "1 rue de l’Exemple 67000 Strasbourg",
  fulfilment: "delivery",
  handedOverAt: null,
  inRound: false,
  deliveredAt: null,
  trackingToken: null,
  createdAt: "2026-10-22T10:00:00Z",
  items: [
    {
      productId: "p-1",
      category: "Fromages et charcuterie",
      name: "Comté fruité (9/10 mois)",
      variant: "500 g",
      unitPriceCents: 1100,
      displayOrder: 10,
      quantity: 2,
    },
  ],
  payments: [],
  document: null,
};
const figures = (o: MemberOrder) => memberOrderFigures(o);

assert.equal(dayLabel("2026-11-27", NOW), "vendredi 27 novembre");
assert.equal(dayLabel("2027-03-20", NOW), "samedi 20 mars 2027");
assert.equal(articleCountLabel(1), "1 article");
assert.equal(articleCountLabel(4), "4 articles");

assert.equal(
  handoverLine(order, NOW),
  "Livraison prévue le vendredi 27 novembre",
);
assert.equal(
  handoverLine({ ...order, fulfilment: "pickup" }, NOW),
  "À récupérer à partir du vendredi 27 novembre",
);
assert.equal(
  handoverLine({ ...order, deliveryDate: null }, NOW),
  "Livraison à domicile, date à venir",
);
assert.match(
  handoverLine({ ...order, deliveredAt: "2026-11-27T15:00:00Z" }, NOW),
  /^Livrée le vendredi 27 novembre$/,
);

assert.equal(stageLabel(figures(order)), "Enregistrée");
assert.equal(
  stageLabel(figures({ ...order, inRound: true })),
  "Dans la tournée",
);

assert.equal(plain(balanceLine(figures(order))), "22,00 € à payer");
const partial = {
  ...order,
  payments: [
    { amountCents: 1000, method: "transfer" as const, paidOn: "2026-10-23" },
  ],
};
assert.equal(plain(balanceLine(figures(partial))), "Reste 12,00 € à payer");
const paid = {
  ...order,
  payments: [
    { amountCents: 2200, method: "cash" as const, paidOn: "2026-10-23" },
  ],
};
assert.equal(balanceLine(figures(paid)), "Tout est payé, merci !");
const over = {
  ...order,
  payments: [
    { amountCents: 2400, method: "cheque" as const, paidOn: "2026-10-23" },
  ],
};
assert.match(plain(balanceLine(figures(over)))!, /payé 2,00 € de trop/);

assert.equal(
  plain(paymentLine(partial.payments[0]!, NOW)),
  "10,00 € par virement, le 23 octobre",
);
assert.equal(
  plain(
    paymentLine(
      { amountCents: -200, method: "cash", paidOn: "2026-11-30" },
      NOW,
    ),
  ),
  "2,00 € remboursés en espèces, le 30 novembre",
);
assert.equal(
  plain(
    paymentLine({ amountCents: 500, method: null, paidOn: "2027-01-02" }, NOW),
  ),
  "5,00 €, le 2 janvier 2027",
);

assert.deepEqual(
  orderSteps(order, figures(order)).map((s) => s.state),
  ["done", "todo", "todo"],
);
assert.deepEqual(
  orderSteps(partial, figures({ ...partial, inRound: true })).map((s) => [
    s.label,
    s.state,
    s.note,
  ]),
  [
    ["Commandée", "done", undefined],
    ["Payée", "current", "en partie"],
    ["Livrée", "current", "en tournée"],
  ],
);
assert.deepEqual(
  orderSteps(
    { ...paid, fulfilment: "pickup" },
    figures({
      ...paid,
      fulfilment: "pickup",
      handedOverAt: "2026-11-27T10:00:00Z",
    }),
  ).map((s) => [s.label, s.state]),
  [
    ["Commandée", "done"],
    ["Payée", "done"],
    ["Récupérée", "done"],
  ],
);

console.log("membres/orders: ok");
