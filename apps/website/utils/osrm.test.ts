// Run with: npx tsx utils/osrm.test.ts
import assert from "node:assert/strict";
import { fetchOSRMRoute } from "./osrm";

const FROM: [number, number] = [7.75, 48.58];
const TO: [number, number] = [7.76, 48.6];
const ROUTE = {
  code: "Ok",
  routes: [
    {
      duration: 420,
      geometry: { type: "LineString", coordinates: [FROM, TO] },
    },
  ],
};

const originalFetch = globalThis.fetch;

interface FetchCall {
  url: string;
  signal: AbortSignal | null | undefined;
}

/** Replaces `fetch` with a fake that records the request it was given. */
function fakeFetch(
  answer: (url: string, init: RequestInit | undefined) => Promise<Response>,
) {
  const calls: FetchCall[] = [];
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, signal: init?.signal });
    return answer(url, init);
  }) as typeof fetch;
  return calls;
}

/** The one request the fake server received. */
function onlyCall(calls: FetchCall[]): FetchCall {
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.ok(call);
  return call;
}

const abortReasonName = (call: FetchCall) =>
  (call.signal?.reason as { name?: string } | undefined)?.name;

/** A fake routing server that answers only when the request is aborted. */
const neverAnswers = (_url: string, init: RequestInit | undefined) =>
  new Promise<Response>((_, reject) => {
    const signal = init?.signal;
    if (!signal) return;
    if (signal.aborted) reject(signal.reason);
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });

async function main() {
  // A route: the URL asks for the full GeoJSON geometry, the answer carries
  // the coordinates and the duration.
  let calls = fakeFetch(async () => Response.json(ROUTE));
  assert.deepEqual(await fetchOSRMRoute(FROM, TO), {
    coordinates: [FROM, TO],
    durationSeconds: 420,
  });
  const first = onlyCall(calls);
  assert.equal(
    first.url,
    "https://router.project-osrm.org/route/v1/driving/7.75,48.58;7.76,48.6?overview=full&geometries=geojson",
  );
  assert.ok(first.signal, "the request carries a signal (the timeout)");

  // Refused (the public server throttles) or no route: null, no throw.
  fakeFetch(async () => new Response("Too Many Requests", { status: 429 }));
  assert.equal(await fetchOSRMRoute(FROM, TO), null);
  fakeFetch(async () => Response.json({ code: "NoRoute", routes: [] }));
  assert.equal(await fetchOSRMRoute(FROM, TO), null);
  fakeFetch(async () => {
    throw new TypeError("Failed to fetch");
  });
  assert.equal(await fetchOSRMRoute(FROM, TO), null);

  // The caller's signal aborts the request: null, and the server saw the
  // abort.
  calls = fakeFetch(neverAnswers);
  const controller = new AbortController();
  const aborted = fetchOSRMRoute(FROM, TO, { signal: controller.signal });
  controller.abort();
  assert.equal(await aborted, null);
  assert.equal(onlyCall(calls).signal?.aborted, true);

  // A request that takes longer than the timeout is given up.
  calls = fakeFetch(neverAnswers);
  const started = Date.now();
  assert.equal(await fetchOSRMRoute(FROM, TO, { timeoutMs: 20 }), null);
  assert.ok(Date.now() - started < 2_000, "gave up at the timeout");
  const timedOut = onlyCall(calls);
  assert.equal(timedOut.signal?.aborted, true);
  assert.equal(abortReasonName(timedOut), "TimeoutError");

  // Without `AbortSignal.any` (older Safari) both still apply.
  const anyDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, "any");
  assert.ok(anyDescriptor);
  Object.defineProperty(AbortSignal, "any", {
    value: undefined,
    configurable: true,
  });
  try {
    calls = fakeFetch(neverAnswers);
    const outer = new AbortController();
    assert.equal(
      await fetchOSRMRoute(FROM, TO, { signal: outer.signal, timeoutMs: 20 }),
      null,
    );
    assert.equal(abortReasonName(onlyCall(calls)), "TimeoutError");
    calls = fakeFetch(neverAnswers);
    const outer2 = new AbortController();
    const pending = fetchOSRMRoute(FROM, TO, {
      signal: outer2.signal,
      timeoutMs: 60_000,
    });
    outer2.abort();
    assert.equal(await pending, null);
    assert.equal(abortReasonName(onlyCall(calls)), "AbortError");
  } finally {
    Object.defineProperty(AbortSignal, "any", anyDescriptor);
  }

  globalThis.fetch = originalFetch;
  console.log("osrm: all tests passed");
}

// Node's `AbortSignal.timeout` timers don't keep the process alive: without
// this watchdog the script would exit (with 0) while waiting for one.
const watchdog = setTimeout(() => {
  console.error("osrm.test.ts: timed out");
  process.exit(1);
}, 20_000);

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    globalThis.fetch = originalFetch;
    clearTimeout(watchdog);
  });
