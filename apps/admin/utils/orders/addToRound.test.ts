// The add of chosen buyers: what `order_ids` may hold, when the driver's
// latest round is over (a new one is opened, as add_sale_orders_to_delivery
// and the app decide), and the add itself through a fake client, with the
// number written on a stop. Fake data only.
import type { createClient } from "@/utils/supabase/server";
import { normalizePhone } from "@repo/domain/utils/orders";
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

// --- The add itself: the stops in one insert, one guarded link per buyer,
// the stops nobody took removed together ---
type Call = { table: string; chain: [string, ...unknown[]][] };
type Answer = { data: unknown; error: { message: string } | null };
type Client = Awaited<ReturnType<typeof createClient>>;

const METHODS = [
  "select",
  "insert",
  "update",
  "delete",
  "eq",
  "in",
  "is",
  "order",
  "limit",
  "single",
  "maybeSingle",
];

/** Records every query as its chain of calls; `answer` plays the database. */
function fakeClient(answer: (call: Call) => Answer) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, chain: [] };
      const builder: Record<string, unknown> = {
        then(
          resolve: (value: Answer) => unknown,
          reject: (reason: unknown) => unknown,
        ) {
          calls.push(call);
          return Promise.resolve()
            .then(() => answer(call))
            .then(resolve, reject);
        },
      };
      for (const method of METHODS) {
        builder[method] = (...args: unknown[]) => {
          call.chain.push([method, ...args]);
          return builder;
        };
      }
      return builder;
    },
  } as unknown as Client;
  return { client, calls };
}

const kind = (call: Call) => call.chain[0]?.[0];
const arg = (call: Call, method: string) =>
  call.chain.find(([m]) => m === method)?.slice(1);
const of = (calls: Call[], table: string, op: string) =>
  calls.filter((c) => c.table === table && kind(c) === op);

const SALE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DRIVER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ROUND = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const buyer = (n: number, name: string, address = `${n} rue de l'Exemple`) => ({
  id: O(n),
  buyer_name: name,
  buyer_phone: "06 12 34 56 78",
  buyer_address: address,
  created_at: `2026-11-0${n}T10:00:00Z`,
});
// In name order: Anne, Marc, Zoé. Léa has no address: skipped.
const ORDERS = [
  buyer(3, "Zoé"),
  buyer(1, "Anne"),
  buyer(2, "Marc"),
  buyer(4, "Léa", " "),
];

/**
 * The driver's latest round has a stop at place 4 left to deliver (and one
 * delivered at 3): the add fills it from place 5.
 */
function scenario(
  opts: {
    orders?: typeof ORDERS;
    takenMeanwhile?: string[];
    linkFails?: string;
  } = {},
) {
  return fakeClient((call) => {
    const op = kind(call);
    if (call.table === "orders" && op === "select") {
      // The chosen orders (`.in`), then the recount of the sale.
      return arg(call, "in")
        ? { data: opts.orders ?? ORDERS, error: null }
        : {
            data: [
              { buyer_address: " " },
              { buyer_address: "9 rue de l'Exemple" },
            ],
            error: null,
          };
    }
    if (call.table === "deliveries" && op === "select") {
      return { data: { id: ROUND }, error: null };
    }
    if (call.table === "delivery_recipients" && op === "select") {
      return {
        data: [
          { sort_order: 4, delivered_at: null },
          { sort_order: 3, delivered_at: "2026-11-01T18:00:00Z" },
        ],
        error: null,
      };
    }
    if (call.table === "delivery_recipients" && op === "insert") {
      const rows = [call.chain[0]?.[1]].flat() as { sort_order: number }[];
      // Given back in another order than sent: the add matches by place.
      const stops = rows
        .map((r) => ({ id: `stop-${r.sort_order}`, sort_order: r.sort_order }))
        .reverse();
      const single = call.chain.some(([m]) => m === "single");
      return { data: single ? stops[0] : stops, error: null };
    }
    if (call.table === "orders" && op === "update") {
      const orderId = arg(call, "eq")?.[1] as string;
      if (orderId === opts.linkFails) {
        return { data: null, error: { message: "lien impossible" } };
      }
      return {
        data: opts.takenMeanwhile?.includes(orderId) ? [] : [{ id: orderId }],
        error: null,
      };
    }
    if (call.table === "delivery_recipients" && op === "delete") {
      return { data: null, error: null };
    }
    throw new Error(`unexpected query: ${call.table} ${op}`);
  });
}

async function main() {
  // Three buyers, one of them (Marc) taken by another add meanwhile.
  {
    const { client, calls } = scenario({ takenMeanwhile: [O(2)] });
    const result = await addOrdersToRound(client, SALE, DRIVER, [
      O(1),
      O(2),
      O(3),
      O(4),
    ]);
    assert.deepEqual(result, {
      ok: true,
      result: { delivery_id: ROUND, added: 2, without_address: 1 },
    });
    // The round wasn't over: none opened.
    assert.equal(of(calls, "deliveries", "insert").length, 0);
    // One insert for the three stops, in name order, after the last place.
    const inserts = of(calls, "delivery_recipients", "insert");
    assert.equal(inserts.length, 1);
    const rows = inserts[0]?.chain[0]?.[1] as Record<string, unknown>[];
    assert.deepEqual(
      rows.map((r) => [r.label, r.sort_order, r.delivery_id]),
      [
        ["Anne", 5, ROUND],
        ["Marc", 6, ROUND],
        ["Zoé", 7, ROUND],
      ],
    );
    assert.equal(rows[0]?.address, "1 rue de l'Exemple");
    assert.equal(rows[0]?.phone_number, normalizePhone("06 12 34 56 78"));
    assert.ok(rows.every((r) => typeof r.public_token === "string"));
    // Each order linked to its own stop, only while it has none.
    const links = of(calls, "orders", "update");
    assert.deepEqual(
      links.map((c) => [
        arg(c, "eq")?.[1],
        (c.chain[0]?.[1] as { delivery_recipient_id: string })
          .delivery_recipient_id,
      ]),
      [
        [O(1), "stop-5"],
        [O(2), "stop-6"],
        [O(3), "stop-7"],
      ],
    );
    assert.ok(
      links.every((c) => {
        const guard = arg(c, "is");
        return guard?.[0] === "delivery_recipient_id" && guard[1] === null;
      }),
    );
    // Marc's stop is the one removed, in one query.
    const deletes = of(calls, "delivery_recipients", "delete");
    assert.equal(deletes.length, 1);
    const [removal] = deletes;
    assert.ok(removal);
    assert.deepEqual(arg(removal, "in"), ["id", ["stop-6"]]);
  }

  // The link of the second buyer fails: the add stops there and reports it,
  // and the stops of that buyer and the next (never tried) are removed.
  {
    const { client, calls } = scenario({ linkFails: O(2) });
    const result = await addOrdersToRound(client, SALE, DRIVER, [
      O(1),
      O(2),
      O(3),
    ]);
    assert.equal(result.ok, false);
    assert.equal(
      !result.ok && result.fallback,
      "Les acheteurs n'ont pas pu être ajoutés",
    );
    assert.equal(of(calls, "orders", "update").length, 2);
    const deletes = of(calls, "delivery_recipients", "delete");
    assert.equal(deletes.length, 1);
    const [removal] = deletes;
    assert.ok(removal);
    const removed = arg(removal, "in")?.[1] as string[];
    assert.deepEqual([...removed].sort(), ["stop-6", "stop-7"]);
  }

  // Nobody waiting (no address): nothing written, the round reported as is.
  {
    const { client, calls } = scenario({ orders: [buyer(4, "Léa", " ")] });
    const result = await addOrdersToRound(client, SALE, DRIVER, [O(4)]);
    assert.deepEqual(result, {
      ok: true,
      result: { delivery_id: ROUND, added: 0, without_address: 1 },
    });
    assert.equal(of(calls, "delivery_recipients", "insert").length, 0);
    assert.equal(of(calls, "orders", "update").length, 0);
    assert.equal(of(calls, "delivery_recipients", "delete").length, 0);
  }

  // A number written « +33 (0)6… » reaches the stop in the international
  // form the SMS need (the rule of @repo/domain/utils/orders).
  {
    const { client, calls } = scenario({
      orders: [
        { ...buyer(1, "Léa TEST"), buyer_phone: "+33 (0)6 39 98 12 34" },
      ],
    });
    const result = await addOrdersToRound(client, SALE, DRIVER, [O(1)]);
    assert.equal(result.ok, true);
    const rows = of(calls, "delivery_recipients", "insert")[0]
      ?.chain[0]?.[1] as Record<string, unknown>[] | undefined;
    assert.equal(rows?.[0]?.label, "Léa TEST");
    assert.equal(rows?.[0]?.phone_number, "+33639981234");
  }

  console.log("orders/addToRound: all assertions passed");
}

main();
