import assert from "node:assert/strict";
import { moveSortOrders, nextSortOrder } from "./joiningContent";

const items = [
  { id: "a", sort_order: 10 },
  { id: "b", sort_order: 20 },
  { id: "c", sort_order: 30 },
];
assert.deepEqual(moveSortOrders(items, "b", "up"), [
  { id: "a", sort_order: 20 },
  { id: "b", sort_order: 10 },
]);
assert.deepEqual(moveSortOrders(items, "b", "down"), [
  { id: "b", sort_order: 30 },
  { id: "c", sort_order: 20 },
]);
assert.deepEqual(moveSortOrders(items, "a", "up"), []);
assert.deepEqual(moveSortOrders(items, "c", "down"), []);
assert.deepEqual(moveSortOrders(items, "z", "up"), []);

// Ties are spread out first, so the move is visible.
const tied = [
  { id: "a", sort_order: 0 },
  { id: "b", sort_order: 0 },
  { id: "c", sort_order: 0 },
];
assert.deepEqual(moveSortOrders(tied, "c", "up"), [
  { id: "a", sort_order: 10 },
  { id: "b", sort_order: 30 },
  { id: "c", sort_order: 20 },
]);

assert.equal(nextSortOrder(items), 40);
assert.equal(nextSortOrder([]), 10);

console.log("joiningContent.test.ts: ok");
