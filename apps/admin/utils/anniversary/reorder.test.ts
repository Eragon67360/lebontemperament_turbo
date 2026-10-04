import assert from "node:assert/strict";
import {
  applyUpdates,
  nextOrder,
  planDrag,
  planMove,
  renumber,
  sortByOrder,
} from "./reorder";

const item = (id: string, display_order: number) => ({ id, display_order });

// --- sortByOrder: by number, ties keep their position ---
assert.deepEqual(
  sortByOrder([item("c", 3), item("a", 1), item("b", 1)]).map((i) => i.id),
  ["a", "b", "c"],
);

// --- renumber: only rows whose number changes are sent ---
assert.deepEqual(renumber([item("a", 1), item("b", 2), item("c", 3)]), []);
assert.deepEqual(renumber([item("a", 5), item("b", 2), item("c", 9)]), [
  { id: "a", display_order: 1 },
  { id: "c", display_order: 3 },
]);

// --- planMove: a clean list swaps two neighbours ---
{
  const list = [item("a", 1), item("b", 2), item("c", 3)];
  const { ordered, updates } = planMove(list, "b", "up");
  assert.deepEqual(
    ordered.map((i) => i.id),
    ["b", "a", "c"],
  );
  assert.deepEqual(updates, [
    { id: "b", display_order: 1 },
    { id: "a", display_order: 2 },
  ]);
}

// Moving down the second of three
{
  const { updates } = planMove(
    [item("a", 1), item("b", 2), item("c", 3)],
    "b",
    "down",
  );
  assert.deepEqual(updates, [
    { id: "c", display_order: 2 },
    { id: "b", display_order: 3 },
  ]);
}

// At the edges nothing happens
assert.deepEqual(planMove([item("a", 1), item("b", 2)], "a", "up").updates, []);
assert.deepEqual(
  planMove([item("a", 1), item("b", 2)], "b", "down").updates,
  [],
);
assert.deepEqual(planMove([item("a", 1)], "zz", "up").updates, []);

// Orders typed by hand (gaps and duplicates) get renumbered when touched:
// every row whose number changes is sent, so the result is unambiguous.
{
  const messy = [item("a", 4), item("b", 4), item("c", 10)];
  const { ordered, updates } = planMove(messy, "c", "up");
  assert.deepEqual(
    ordered.map((i) => i.id),
    ["a", "c", "b"],
  );
  assert.deepEqual(updates, [
    { id: "a", display_order: 1 },
    { id: "c", display_order: 2 },
    { id: "b", display_order: 3 },
  ]);
}

// The input list is not mutated
{
  const list = [item("a", 1), item("b", 2)];
  planMove(list, "b", "up");
  assert.deepEqual(list, [item("a", 1), item("b", 2)]);
}

// --- planDrag: drop onto another row's position ---
{
  const list = [item("a", 1), item("b", 2), item("c", 3), item("d", 4)];
  const { ordered, updates } = planDrag(list, "a", "c");
  assert.deepEqual(
    ordered.map((i) => i.id),
    ["b", "c", "a", "d"],
  );
  assert.deepEqual(updates, [
    { id: "b", display_order: 1 },
    { id: "c", display_order: 2 },
    { id: "a", display_order: 3 },
  ]);
  assert.deepEqual(planDrag(list, "a", "a").updates, []);
  assert.deepEqual(planDrag(list, "a", "nope").updates, []);
}

// --- nextOrder and applyUpdates ---
assert.equal(nextOrder([]), 1);
assert.equal(nextOrder([item("a", 3), item("b", 7)]), 8);
assert.deepEqual(
  applyUpdates(
    [item("a", 1), item("b", 2)],
    [
      { id: "a", display_order: 2 },
      { id: "b", display_order: 1 },
    ],
  ).map((i) => i.id),
  ["b", "a"],
);

console.log("reorder.test.ts: ok");
