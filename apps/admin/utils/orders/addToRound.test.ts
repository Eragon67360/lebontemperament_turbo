// The add of chosen buyers: what `order_ids` may hold, and when the driver's
// latest round is over (a new one is opened, as add_sale_orders_to_delivery
// and the app decide). Fake ids only.
import assert from "node:assert/strict";
import { isFinishedRound, MAX_ORDER_IDS, parseOrderIds } from "./addToRound";

const O = (n: number) =>
  `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;

// Absent: the whole sale.
assert.equal(parseOrderIds(undefined), null);
assert.equal(parseOrderIds({}), null);
assert.equal(parseOrderIds({ order_ids: null }), null);
assert.equal(parseOrderIds({ driver_id: O(1) }), null);

// Chosen buyers, repeats (whatever the case) dropped.
assert.deepEqual(parseOrderIds({ order_ids: [O(1)] }), [O(1)]);
assert.deepEqual(
  parseOrderIds({ order_ids: [O(1), O(2), O(1).toUpperCase()] }),
  [O(1), O(2)],
);

// Anything else is refused, never read as « everyone ».
for (const order_ids of [
  [],
  "x",
  O(1),
  [O(1), "pas-un-id"],
  [O(1), 2],
  Array.from({ length: MAX_ORDER_IDS + 1 }, (_, i) => O(i)),
]) {
  assert.equal(parseOrderIds({ order_ids }), "Acheteurs invalides");
}
assert.deepEqual(
  parseOrderIds({
    order_ids: Array.from({ length: MAX_ORDER_IDS }, (_, i) => O(i)),
  })?.length,
  MAX_ORDER_IDS,
);

// Over: stops, all delivered. Empty or with a stop left: the one to fill.
const done = { delivered_at: "2026-11-27T18:00:00Z" };
const left = { delivered_at: null };
assert.equal(isFinishedRound([]), false);
assert.equal(isFinishedRound([left]), false);
assert.equal(isFinishedRound([done, left]), false);
assert.equal(isFinishedRound([done]), true);
assert.equal(isFinishedRound([done, done]), true);

console.log("orders/addToRound: all assertions passed");
