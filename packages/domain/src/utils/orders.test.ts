import assert from "node:assert/strict";
import {
  balanceStatus,
  buyerBreakdown,
  eurosForSpreadsheet,
  formatEuros,
  formatPhone,
  groupProductsByCategory,
  isValidPhone,
  normalizePhone,
  parseEuros,
  parseOrderInput,
  parsePaymentInput,
  parseProductInput,
  parseSaleInput,
  productLabel,
  productsById,
  saleSpreadsheet,
  saleSummary,
  type OrderLike,
  type OrderProductLike,
} from "./orders";

const P = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const products: OrderProductLike[] = [
  {
    id: P(1),
    category: "Fromages",
    name: "Raclette",
    variant: "1 kg",
    supplier: "Fruitière",
    unit_price_cents: 1700,
    display_order: 20,
  },
  {
    id: P(2),
    category: "Fromages",
    name: "Bleu de Gex",
    variant: "500 g",
    supplier: "Fruitière",
    unit_price_cents: 850,
    display_order: 10,
  },
  {
    id: P(3),
    category: "Saucissons",
    name: "Saucisson",
    variant: "Noix",
    supplier: "Salaison",
    unit_price_cents: 400,
    display_order: 30,
  },
  {
    id: P(4),
    category: "Saucissons",
    name: "Saucisson",
    variant: "Figues",
    supplier: null,
    unit_price_cents: 400,
    display_order: 40,
  },
];
const byId = productsById(products);

// Money
const plain = (s: string) => s.replace(/[  ]/g, " ");
assert.equal(plain(formatEuros(1100)), "11,00 €");
assert.equal(plain(formatEuros(123450)), "1 234,50 €");
assert.equal(plain(formatEuros(-400)), "-4,00 €");
assert.equal(eurosForSpreadsheet(850), "8,50");
assert.equal(eurosForSpreadsheet(-1250), "-12,50");
assert.equal(parseEuros("8,50"), 850);
assert.equal(parseEuros("8.5"), 850);
assert.equal(parseEuros(" 12 € "), 1200);
assert.equal(parseEuros("1 234,5"), 123450);
assert.equal(parseEuros("-4"), -400);
assert.equal(parseEuros("8,505"), null);
assert.equal(parseEuros("abc"), null);
assert.equal(parseEuros(""), null);

// Labels and grouping
assert.equal(productLabel(products[0]!), "Raclette · 1 kg");
assert.equal(productLabel({ name: "Fondue", variant: null }), "Fondue");
assert.equal(productLabel({ name: "Fondue", variant: "  " }), "Fondue");
assert.deepEqual(
  groupProductsByCategory(products).map((g) => [
    g.category,
    g.products.map((p) => p.id),
  ]),
  [
    ["Fromages", [P(2), P(1)]],
    ["Saucissons", [P(3), P(4)]],
  ],
);

// Balance states
assert.equal(balanceStatus(0, 0), "empty");
assert.equal(balanceStatus(1000, 0), "unpaid");
assert.equal(balanceStatus(1000, 400), "partial");
assert.equal(balanceStatus(1000, 1000), "paid");
assert.equal(balanceStatus(1000, 1200), "overpaid");
assert.equal(balanceStatus(0, 500), "overpaid");

// One buyer: lines in catalogue order, unknown products ignored
const marie: OrderLike = {
  id: "o-marie",
  buyer_name: "Marie Test",
  fulfilment: "delivery",
  items: [
    { product_id: P(1), quantity: 2 },
    { product_id: P(2), quantity: 1 },
    { product_id: "unknown", quantity: 5 },
    { product_id: P(3), quantity: 0 },
  ],
  payments: [
    { amount_cents: 2000, method: "cash" },
    { amount_cents: 500, method: "cheque" },
  ],
};
const m = buyerBreakdown(marie, byId);
assert.deepEqual(
  m.lines.map((l) => [l.label, l.quantity, l.amountCents]),
  [
    ["Bleu de Gex · 500 g", 1, 850],
    ["Raclette · 1 kg", 2, 3400],
  ],
);
assert.equal(m.totalCents, 4250);
assert.equal(m.paidCents, 2500);
assert.equal(m.dueCents, 1750);
assert.equal(m.status, "partial");

// A sale
const orders: OrderLike[] = [
  marie,
  {
    id: "o-zoe",
    buyer_name: "zoé Test",
    fulfilment: "pickup",
    items: [{ product_id: P(3), quantity: 3 }],
    payments: [{ amount_cents: 1500, method: "transfer" }],
  },
  {
    id: "o-eric",
    buyer_name: "Éric Test",
    fulfilment: "delivery",
    items: [
      { product_id: P(4), quantity: 2 },
      { product_id: P(3), quantity: 1 },
    ],
    payments: [],
  },
];
const s = saleSummary(products, orders);
assert.deepEqual(
  s.buyers.map((b) => b.buyerName),
  ["Éric Test", "Marie Test", "zoé Test"],
  "accents and case don't change the alphabetical order",
);
assert.equal(s.orderCount, 3);
assert.equal(s.totalCents, 4250 + 1200 + 1200);
assert.equal(s.paidCents, 2500 + 1500);
assert.equal(
  s.dueCents,
  1750 + 1200,
  "overpayment doesn't offset what others owe",
);
assert.equal(s.overpaidCents, 300);
assert.equal(s.paidCount, 1);
assert.equal(s.owingCount, 2);
assert.deepEqual(s.byMethod, { transfer: 1500, cash: 2000, cheque: 500 });
assert.deepEqual(
  s.products.map((p) => [p.label, p.quantity, p.amountCents]),
  [
    ["Bleu de Gex · 500 g", 1, 850],
    ["Raclette · 1 kg", 2, 3400],
    ["Saucisson · Noix", 4, 1600],
    ["Saucisson · Figues", 2, 800],
  ],
);
assert.deepEqual(
  s.suppliers.map((x) => [x.supplier, x.quantity, x.amountCents]),
  [
    ["Fruitière", 3, 4250],
    ["Salaison", 4, 1600],
    [null, 2, 800],
  ],
);
const empty = saleSummary(products, []);
assert.equal(empty.totalCents, 0);
assert.deepEqual(empty.products, []);

// Spreadsheet
const sheet = saleSpreadsheet(
  s,
  new Map([
    [
      "o-marie",
      { phone: "+33600000000", address: "1 rue Exemple", soldBy: "Anne Test" },
    ],
  ]),
);
assert.deepEqual(sheet[0], [
  "Acheteur",
  "Téléphone",
  "Adresse",
  "Vendu par",
  "Mode",
  "Bleu de Gex · 500 g",
  "Raclette · 1 kg",
  "Saucisson · Noix",
  "Saucisson · Figues",
  "Total (€)",
  "Payé (€)",
  "Reste à payer (€)",
  "État",
]);
assert.deepEqual(sheet[2], [
  "Marie Test",
  "+33600000000",
  "1 rue Exemple",
  "Anne Test",
  "Livraison",
  "1",
  "2",
  "",
  "",
  "42,50",
  "25,00",
  "17,50",
  "Paiement partiel",
]);
assert.deepEqual(sheet.at(-1)!.slice(0, 1), ["Total"]);
assert.deepEqual(sheet.at(-1)!.slice(5, 12), [
  "1",
  "2",
  "4",
  "2",
  "66,50",
  "40,00",
  "26,50",
]);
assert.equal(sheet.length, 1 + 3 + 1);

// Phones
assert.equal(normalizePhone("06 12 34 56 78"), "+33612345678");
assert.equal(normalizePhone("06.12.34.56.78"), "+33612345678");
assert.equal(normalizePhone("0033 6 12 34 56 78"), "+33612345678");
assert.equal(normalizePhone("0041 79 123 45 67"), "+41791234567");
assert.equal(normalizePhone("+41 79 123 45 67"), "+41791234567");
assert.equal(normalizePhone("  "), null);
assert.equal(normalizePhone(null), null);
assert.ok(isValidPhone("06 12 34 56 78"));
for (const typed of [
  "0677565184",
  "06 77 56 51 84",
  "06.77.56.51.84",
  "+33 6 77 56 51 84",
  "+33677565184",
  "0033 6 77 56 51 84",
  "+33 (0)6 77 56 51 84",
]) {
  assert.equal(formatPhone(typed), "06 77 56 51 84", typed);
}
// While typing.
assert.equal(formatPhone("0"), "0");
assert.equal(formatPhone("06"), "06");
assert.equal(formatPhone("067"), "06 7");
assert.equal(formatPhone("06 77 5"), "06 77 5");
assert.equal(formatPhone("06 77 "), "06 77");
assert.equal(formatPhone("+33 6 77"), "+33 6 77");
assert.equal(formatPhone("00"), "00");
// Kept as written.
assert.equal(formatPhone("+41 79 123 45 67"), "+41 79 123 45 67");
assert.equal(formatPhone("06 77 56 51 84 12"), "06 77 56 51 84 12");
assert.ok(isValidPhone("+33 6 12 34 56 78"));
assert.ok(!isValidPhone("12"));
assert.ok(!isValidPhone("06 12 34"));
assert.ok(!isValidPhone("abc"));

// Sale input
assert.deepEqual(
  parseSaleInput({
    title: "  Vente  ",
    order_deadline: "2026-11-13",
    delivery_date: "",
  }),
  {
    ok: true,
    value: {
      title: "Vente",
      order_deadline: "2026-11-13",
      delivery_date: null,
    },
  },
);
assert.equal(parseSaleInput({ title: "" }).ok, false);
assert.equal(
  parseSaleInput({ title: "x", delivery_date: "2026-02-30" }).ok,
  false,
);
const late = parseSaleInput({
  title: "x",
  order_deadline: "2026-11-28",
  delivery_date: "2026-11-27",
});
assert.ok(!late.ok && late.field === "order_deadline");
assert.equal(parseSaleInput(null).ok, false);

// Product input
assert.deepEqual(
  parseProductInput({
    category: "Fromages",
    name: "Morbier",
    variant: "",
    unit_price_cents: 800,
  }),
  {
    ok: true,
    value: {
      category: "Fromages",
      name: "Morbier",
      variant: null,
      supplier: null,
      unit_price_cents: 800,
      is_available: true,
    },
  },
);
for (const bad of [-1, 8.5, 100001, "800", null]) {
  const r = parseProductInput({
    category: "c",
    name: "n",
    unit_price_cents: bad,
  });
  assert.ok(!r.ok && r.field === "unit_price_cents", `price ${bad} refused`);
}
assert.equal(
  parseProductInput({ category: "c", name: "n", unit_price_cents: 0 }).ok,
  true,
  "a free product is allowed",
);

// Order input
const ids = new Set(products.map((p) => p.id));
const good = parseOrderInput(
  {
    buyer_name: " Marie Test ",
    buyer_phone: "06 12 34 56 78",
    buyer_address: "",
    sold_by: "",
    fulfilment: "pickup",
    items: [
      { product_id: P(1), quantity: 2 },
      { product_id: P(2), quantity: 0 },
    ],
  },
  ids,
);
assert.deepEqual(good, {
  ok: true,
  value: {
    order: {
      buyer_name: "Marie Test",
      buyer_phone: "06 12 34 56 78",
      buyer_address: null,
      sold_by: null,
      fulfilment: "pickup",
      notes: null,
    },
    items: [{ product_id: P(1), quantity: 2 }],
  },
});
{
  const r = parseOrderInput(
    {
      buyer_name: "A",
      buyer_phone: "+33612345678",
      items: [{ product_id: P(1), quantity: 1 }],
    },
    ids,
  );
  assert.equal(
    r.ok && r.value.order.buyer_phone,
    "06 12 34 56 78",
    "saved in the French form",
  );
}
const refuse = (body: unknown, field: string) => {
  const r = parseOrderInput(body, ids);
  assert.ok(!r.ok, JSON.stringify(body));
  assert.equal(r.ok ? undefined : r.field, field, JSON.stringify(body));
};
const base = { buyer_name: "A", items: [{ product_id: P(1), quantity: 1 }] };
refuse({ ...base, buyer_name: "  " }, "buyer_name");
refuse({ ...base, buyer_phone: "123" }, "buyer_phone");
refuse({ ...base, sold_by: "nobody" }, "sold_by");
refuse({ ...base, fulfilment: "drone" }, "fulfilment");
refuse({ ...base, items: [] }, "items");
refuse({ ...base, items: [{ product_id: P(1), quantity: 0 }] }, "items");
refuse({ ...base, items: [{ product_id: P(9), quantity: 1 }] }, "items");
refuse({ ...base, items: [{ product_id: P(1), quantity: 1.5 }] }, "items");
refuse({ ...base, items: [{ product_id: P(1), quantity: 1000 }] }, "items");
refuse(
  {
    ...base,
    items: [
      { product_id: P(1), quantity: 1 },
      { product_id: P(1), quantity: 2 },
    ],
  },
  "items",
);
refuse({ ...base, buyer_address: "x".repeat(301) }, "buyer_address");
assert.equal(parseOrderInput({ ...base, fulfilment: undefined }, ids).ok, true);

// Payment input
assert.deepEqual(
  parsePaymentInput({
    amount_cents: 2500,
    method: "cheque",
    paid_on: "2026-11-10",
  }),
  {
    ok: true,
    value: {
      amount_cents: 2500,
      method: "cheque",
      paid_on: "2026-11-10",
      note: null,
    },
  },
);
assert.equal(
  parsePaymentInput({ amount_cents: -500, method: "cash" }).ok,
  true,
);
for (const [body, field] of [
  [{ amount_cents: 0, method: "cash" }, "amount_cents"],
  [{ amount_cents: 12.5, method: "cash" }, "amount_cents"],
  [{ amount_cents: 100001, method: "cash" }, "amount_cents"],
  [{ amount_cents: 100, method: "bitcoin" }, "method"],
  [{ amount_cents: 100, method: "cash", paid_on: "13/11/2026" }, "paid_on"],
] as const) {
  const r = parsePaymentInput(body);
  assert.ok(!r.ok && r.field === field, JSON.stringify(body));
}

console.log("orders: ok");
