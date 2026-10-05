import { assertEquals, assertRejects, assertThrows } from "jsr:@std/assert@1";
import { chunk, mapSettledWithConcurrency } from "./concurrency.ts";

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test("chunk splits in order, last chunk may be shorter", () => {
  const items = Array.from({ length: 45 }, (_, i) => i);
  const chunks = chunk(items, 20);
  assertEquals(
    chunks.map((c) => c.length),
    [20, 20, 5],
  );
  assertEquals(chunks.flat(), items);
  assertEquals(chunk([], 20), []);
  assertThrows(() => chunk([1], 0), RangeError);
});

Deno.test(
  "results keep input order whatever the completion order",
  async () => {
    const delays = [30, 5, 20, 1, 10];
    const results = await mapSettledWithConcurrency(delays, 4, async (d, i) => {
      await tick(d);
      return i;
    });
    assertEquals(
      results.map((r) => (r.status === "fulfilled" ? r.value : -1)),
      [0, 1, 2, 3, 4],
    );
  },
);

Deno.test("never exceeds the concurrency limit, and uses it", async () => {
  let inFlight = 0;
  let peak = 0;
  await mapSettledWithConcurrency(Array.from({ length: 12 }), 4, async () => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await tick(5);
    inFlight--;
  });
  assertEquals(peak, 4);
});

Deno.test("failures are isolated and keep their position", async () => {
  const results = await mapSettledWithConcurrency([1, 2, 3, 4, 5, 6], 4, (n) =>
    n % 3 === 0
      ? Promise.reject(new Error(`bad ${n}`))
      : Promise.resolve(n * 10),
  );
  assertEquals(
    results.map((r) =>
      r.status === "fulfilled" ? r.value : (r.reason as Error).message,
    ),
    [10, 20, "bad 3", 40, 50, "bad 6"],
  );
});

Deno.test("a synchronous throw in the worker is also isolated", async () => {
  const results = await mapSettledWithConcurrency([1, 2], 2, (n) => {
    if (n === 1) throw new Error("sync");
    return Promise.resolve(n);
  });
  assertEquals(results[0].status, "rejected");
  assertEquals(results[1].status, "fulfilled");
});

Deno.test("empty input and invalid limit", async () => {
  assertEquals(
    await mapSettledWithConcurrency([], 4, () => Promise.resolve(1)),
    [],
  );
  await assertRejects(
    () => mapSettledWithConcurrency([1], 0, () => Promise.resolve(1)),
    RangeError,
  );
});
