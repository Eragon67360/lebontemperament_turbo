// « Mes ventes »: how the seller_* functions' JSON becomes the pages' data,
// and what a seller's order may send. Fake data only.
import assert from "node:assert/strict";
import {
  NOT_A_SELLER,
  parseSellerSales,
  sellerDetail,
  sellerOrderBody,
} from "./seller";
import { describeDbError } from "./server";

// seller_sales(): malformed entries are left out.
assert.deepEqual(
  parseSellerSales([
    {
      id: "s1",
      title: "Fromages TEST",
      order_deadline: "2026-11-13",
      delivery_date: null,
    },
    { id: 2, title: "pas un id" },
    "n'importe quoi",
  ]),
  [
    {
      id: "s1",
      title: "Fromages TEST",
      order_deadline: "2026-11-13",
      delivery_date: null,
    },
  ],
);
assert.deepEqual(parseSellerSales(null), []);
assert.deepEqual(parseSellerSales({ id: "s1" }), []);

// seller_sale(): the seller's orders, with the superadmin-only columns null
// and the seller as the only « vendu par ».
const me = { id: "me", name: "Jules TEST" };
const detail = sellerDetail(
  {
    sale: { id: "s1", title: "Fromages TEST" },
    products: [{ id: "p1" }],
    orders: [
      {
        id: "o1",
        buyer_name: "Nora TEST",
        sold_by: "me",
        items: [{ product_id: "p1", quantity: 2 }],
        payments: [],
      },
      { id: "o2", buyer_name: "Sans listes TEST", sold_by: "me" },
      null,
    ],
  },
  me,
);
assert.ok(detail);
assert.equal(detail.orders.length, 2);
assert.equal(detail.orders[0]!.document_key, null);
assert.equal(detail.orders[0]!.buyer_member_id, null);
assert.deepEqual(detail.orders[0]!.items, [{ product_id: "p1", quantity: 2 }]);
assert.deepEqual(detail.orders[1]!.items, []);
assert.deepEqual(detail.orders[1]!.payments, []);
assert.deepEqual(detail.sellers, { me: "Jules TEST" });
assert.deepEqual(detail.saleSellers, ["me"]);
assert.equal(sellerDetail(null, me), null);
assert.equal(sellerDetail({ products: [] }, me), null);

// A seller's order never carries who sold it nor a member link.
assert.deepEqual(
  sellerOrderBody({
    buyer_name: "Nora TEST",
    buyer_phone: "06 00 00 00 00",
    buyer_address: null,
    sold_by: "someone-else",
    fulfilment: "pickup",
    notes: null,
    buyer_member_id: "a-member",
  }),
  {
    buyer_name: "Nora TEST",
    buyer_phone: "06 00 00 00 00",
    buyer_address: null,
    fulfilment: "pickup",
    notes: null,
  },
);

// A refusal speaks to the seller, not about superadmins.
assert.deepEqual(
  describeDbError({ code: "42501", message: "x" }, "fallback", NOT_A_SELLER),
  { status: 403, error: NOT_A_SELLER },
);
assert.deepEqual(describeDbError({ code: "42501" }, "fallback"), {
  status: 403,
  error: "Réservé aux superadmins",
});

console.log("orders/seller: all assertions passed");
