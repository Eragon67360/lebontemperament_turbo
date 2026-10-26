// The add of chosen buyers: what `order_ids` may hold, when the driver's
// latest round is over (a new one is opened, as add_sale_orders_to_delivery
// and the app decide), and the number written on a stop. Fake data only.
import assert from "node:assert/strict";
import {
  addOrdersToRound,
  isFinishedRound,
  MAX_ORDER_IDS,
  parseOrderIds,
} from "./addToRound";

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

// The stop of a buyer whose number was written « +33 (0)6… » carries the
// international form the SMS need (the rule of @repo/domain/utils/orders).
// The client answers each table and operation with its next fixed rows and
// keeps what was inserted.
type Client = Parameters<typeof addOrdersToRound>[0];
type Row = Record<string, unknown>;

function fakeClient(answers: Record<string, unknown[]>, inserts: Row[]) {
  const from = (table: string) => {
    let op = "select";
    const chain: unknown = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") {
            const data = answers[`${table}.${op}`]?.shift() ?? null;
            return (resolve: (value: unknown) => void) =>
              resolve({ data, error: null });
          }
          return (...args: unknown[]) => {
            if (prop === "insert" || prop === "update" || prop === "delete") {
              op = prop;
              if (prop === "insert") {
                inserts.push({ table, ...(args[0] as Row) });
              }
            }
            return chain;
          };
        },
      },
    );
    return chain;
  };
  return { from } as unknown as Client;
}

const SALE = "11111111-1111-4111-8111-111111111111";
const DRIVER = "22222222-2222-4222-8222-222222222222";
const ROUND = "33333333-3333-4333-8333-333333333333";
const STOP = "44444444-4444-4444-8444-444444444444";
const inserts: Row[] = [];
const client = fakeClient(
  {
    "orders.select": [
      [
        {
          id: O(1),
          buyer_name: "Léa TEST",
          buyer_phone: "+33 (0)6 39 98 12 34",
          buyer_address: "1 rue de l'Exemple",
          created_at: "2026-10-01T00:00:00Z",
        },
      ],
      [],
    ],
    "deliveries.select": [null],
    "deliveries.insert": [{ id: ROUND }],
    "delivery_recipients.insert": [{ id: STOP }],
    "orders.update": [[{ id: O(1) }]],
  },
  inserts,
);
const added = await addOrdersToRound(client, SALE, DRIVER, [O(1)]);
assert.deepEqual(added, {
  ok: true,
  result: { delivery_id: ROUND, added: 1, without_address: 0 },
});
const stop = inserts.find((row) => row.table === "delivery_recipients");
assert.equal(stop?.label, "Léa TEST");
assert.equal(stop?.phone_number, "+33639981234");

console.log("orders/addToRound: all assertions passed");
