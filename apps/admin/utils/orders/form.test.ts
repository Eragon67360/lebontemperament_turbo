// The forms of « Commandes »: the rules before the round trip and the bodies
// sent to the routes. Fake data only.
import assert from "node:assert/strict";
import {
  eurosInput,
  isoDay,
  missesDeliveryAddress,
  NONE,
  orderableProducts,
  orderFormDefaults,
  orderFormSchema,
  orderFormToBody,
  paymentFormDefaults,
  paymentFormSchema,
  paymentFormToBody,
  productFormDefaults,
  productFormSchema,
  productFormToBody,
  quantitiesTotalCents,
  readQuantity,
  saleFormDefaults,
  saleFormSchema,
  saleFormToBody,
  stepQuantity,
} from "./form";
import type { SaleOrder, SaleProduct } from "./types";

const P1 = "aaaaaaaa-aaaa-4aaa-8aaa-000000000001";
const P2 = "aaaaaaaa-aaaa-4aaa-8aaa-000000000002";
const P3 = "aaaaaaaa-aaaa-4aaa-8aaa-000000000003";
const MEMBER = "dddddddd-dddd-4ddd-8ddd-000000000001";

const product = (id: string, fields: Partial<SaleProduct>): SaleProduct => ({
  id,
  sale_id: "11111111-1111-4111-8111-111111111111",
  category: "Fromages",
  name: "Comté",
  variant: null,
  supplier: null,
  unit_price_cents: 1100,
  display_order: 10,
  is_available: true,
  created_at: "",
  updated_at: "",
  ...fields,
});
const products = [
  product(P1, {}),
  product(P2, { name: "Raclette", unit_price_cents: 900 }),
  product(P3, { name: "Morbier", unit_price_cents: 800, is_available: false }),
];

// --- Sale ---
{
  const defaults = saleFormDefaults(
    null,
    "22222222-2222-4222-8222-222222222222",
  );
  assert.equal(defaults.title, "");
  assert.equal(defaults.copy_from, "22222222-2222-4222-8222-222222222222");
  assert.equal(defaults.order_deadline, undefined);

  const refused = saleFormSchema.safeParse({ ...defaults, title: "   " });
  assert.equal(refused.success, false);
  assert.equal(
    refused.error?.issues[0]?.message,
    "Le nom de la vente est requis",
  );

  const backwards = saleFormSchema.safeParse({
    ...defaults,
    title: "Vente",
    order_deadline: new Date(2026, 10, 27),
    delivery_date: new Date(2026, 10, 13),
  });
  assert.equal(backwards.success, false);
  assert.deepEqual(backwards.error?.issues[0]?.path, ["order_deadline"]);

  const ok = saleFormSchema.safeParse({
    title: "  Fromages 2026 ",
    order_deadline: new Date(2026, 10, 13),
    delivery_date: new Date(2026, 10, 27),
    copy_from: NONE,
  });
  assert.ok(ok.success);
  assert.deepEqual(saleFormToBody(ok.data), {
    title: "Fromages 2026",
    order_deadline: "2026-11-13",
    delivery_date: "2026-11-27",
    copy_from: null,
  });
  // Local day, never the UTC one.
  assert.equal(isoDay(new Date(2026, 0, 1, 0, 30)), "2026-01-01");
  assert.equal(isoDay(undefined), null);

  const edit = saleFormDefaults(
    { title: "Vente", order_deadline: "2026-11-13", delivery_date: null },
    null,
  );
  assert.equal(edit.order_deadline?.getDate(), 13);
  assert.equal(edit.delivery_date, undefined);
  assert.equal(edit.copy_from, NONE);
}

// --- Product ---
{
  assert.equal(eurosInput(1100), "11,00");
  assert.equal(eurosInput(850), "8,50");
  const defaults = productFormDefaults(null, "Saucissons");
  assert.equal(defaults.category, "Saucissons");
  assert.equal(defaults.is_available, true);
  assert.equal(defaults.price, "");

  const refused = productFormSchema.safeParse({
    ...defaults,
    name: "X",
    price: "abc",
  });
  assert.equal(refused.success, false);
  assert.match(refused.error?.issues[0]?.message ?? "", /montant/);
  const tooMuch = productFormSchema.safeParse({
    ...defaults,
    name: "X",
    price: "1 200",
  });
  assert.equal(tooMuch.success, false);
  assert.match(tooMuch.error?.issues[0]?.message ?? "", /entre 0 et 1 000 €/);

  const ok = productFormSchema.safeParse({
    category: "Fromages",
    name: " Comté ",
    variant: "",
    supplier: " Fruitière TEST ",
    price: "11 €",
    is_available: false,
  });
  assert.ok(ok.success);
  assert.deepEqual(productFormToBody(ok.data), {
    category: "Fromages",
    name: "Comté",
    variant: null,
    supplier: "Fruitière TEST",
    unit_price_cents: 1100,
    is_available: false,
  });
  assert.equal(productFormDefaults(products[1]!).price, "9,00");
}

// --- Order ---
{
  const order = {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-000000000001",
    buyer_name: "Léa TEST",
    buyer_phone: "06 12 34 56 78",
    buyer_address: null,
    sold_by: MEMBER,
    fulfilment: "pickup",
    notes: null,
    items: [
      { product_id: P1, quantity: 2 },
      { product_id: P3, quantity: 1 },
    ],
    payments: [],
  } as unknown as SaleOrder;

  const blank = orderFormDefaults(null, products);
  assert.deepEqual(blank.quantities, { [P1]: 0, [P2]: 0, [P3]: 0 });
  assert.equal(blank.fulfilment, "delivery");
  assert.equal(blank.sold_by, NONE);

  const edit = orderFormDefaults(order, products);
  assert.deepEqual(edit.quantities, { [P1]: 2, [P2]: 0, [P3]: 1 });
  assert.equal(edit.sold_by, MEMBER);
  assert.equal(edit.fulfilment, "pickup");
  assert.equal(edit.buyer_address, "");

  // Hidden products stay listed for the order that has them.
  assert.deepEqual(
    orderableProducts(products, null).map((p) => p.id),
    [P1, P2],
  );
  assert.deepEqual(
    orderableProducts(products, order).map((p) => p.id),
    [P1, P2, P3],
  );

  assert.equal(quantitiesTotalCents(edit.quantities, products), 2 * 1100 + 800);
  assert.equal(stepQuantity(0, -1), 0);
  assert.equal(stepQuantity(998, 5), 999);
  assert.equal(readQuantity(""), 0);
  assert.equal(readQuantity("12"), 12);
  assert.equal(readQuantity("1e3"), 13);
  assert.equal(readQuantity("5000"), 999);

  const nothing = orderFormSchema.safeParse({ ...blank, buyer_name: "Léa" });
  assert.equal(nothing.success, false);
  assert.equal(
    nothing.error?.issues[0]?.message,
    "Ajoutez au moins un produit",
  );
  assert.deepEqual(nothing.error?.issues[0]?.path, ["quantities"]);

  const badPhone = orderFormSchema.safeParse({
    ...edit,
    buyer_phone: "12",
  });
  assert.equal(badPhone.success, false);
  assert.equal(
    badPhone.error?.issues[0]?.message,
    "Ce numéro de téléphone n'est pas valide",
  );

  const noName = orderFormSchema.safeParse({ ...edit, buyer_name: " " });
  assert.equal(noName.success, false);
  assert.equal(
    noName.error?.issues[0]?.message,
    "Le nom de l'acheteur est requis",
  );

  const ok = orderFormSchema.safeParse({
    ...edit,
    buyer_address: " 1 rue de l'Exemple ",
    fulfilment: "delivery",
    notes: "  ",
  });
  assert.ok(ok.success);
  assert.deepEqual(orderFormToBody(ok.data), {
    buyer_name: "Léa TEST",
    buyer_phone: "06 12 34 56 78",
    buyer_address: "1 rue de l'Exemple",
    sold_by: MEMBER,
    fulfilment: "delivery",
    notes: null,
    items: [
      { product_id: P1, quantity: 2 },
      { product_id: P3, quantity: 1 },
    ],
  });
  assert.equal(orderFormToBody({ ...ok.data, sold_by: NONE }).sold_by, null);
  assert.equal(
    orderFormToBody({ ...ok.data, buyer_phone: "+33612345678" }).buyer_phone,
    "06 12 34 56 78",
  );

  // The warning about the round: delivery without an address.
  assert.equal(
    missesDeliveryAddress({ fulfilment: "delivery", buyer_address: " " }),
    true,
  );
  assert.equal(
    missesDeliveryAddress({ fulfilment: "pickup", buyer_address: "" }),
    false,
  );
  assert.equal(
    missesDeliveryAddress({ fulfilment: "delivery", buyer_address: "x" }),
    false,
  );
}

// --- Payment ---
{
  const defaults = paymentFormDefaults(1400, "2026-10-13");
  assert.equal(defaults.amount, "14,00");
  assert.equal(defaults.paid_on.getDate(), 13);
  assert.equal(paymentFormDefaults(0, "2026-10-13").amount, "");
  assert.equal(paymentFormDefaults(-500, "2026-10-13").amount, "");

  const noMethod = paymentFormSchema.safeParse(defaults);
  assert.equal(noMethod.success, false);
  assert.equal(
    noMethod.error?.issues[0]?.message,
    "Choisissez un moyen de paiement",
  );

  const zero = paymentFormSchema.safeParse({
    ...defaults,
    amount: "0",
    method: "cash",
  });
  assert.equal(zero.success, false);
  assert.match(zero.error?.issues[0]?.message ?? "", /différent de 0/);

  const text = paymentFormSchema.safeParse({
    ...defaults,
    amount: "dix",
    method: "cash",
  });
  assert.equal(text.success, false);
  assert.match(text.error?.issues[0]?.message ?? "", /8,50/);

  const ok = paymentFormSchema.safeParse({
    ...defaults,
    amount: "8,5",
    method: "cheque",
    note: " n° 123 ",
  });
  assert.ok(ok.success);
  assert.deepEqual(paymentFormToBody(ok.data), {
    amount_cents: 850,
    method: "cheque",
    paid_on: "2026-10-13",
    note: "n° 123",
  });
  // A refund is a negative amount.
  const refund = paymentFormSchema.safeParse({
    ...defaults,
    amount: "-4",
    method: "cash",
  });
  assert.ok(refund.success);
  assert.equal(paymentFormToBody(refund.data).amount_cents, -400);
}

console.log("orders/form: all assertions passed");
