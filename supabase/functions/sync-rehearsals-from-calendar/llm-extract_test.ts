import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { extractRehearsalFields } from "./llm-extract.ts";

const event = {
  id: "evt_test",
  updated: "2026-09-01T10:00:00.000Z",
  summary: "Répétition Hommes",
  start: { dateTime: "2026-11-05T20:00:00+01:00" },
  end: { dateTime: "2026-11-05T22:00:00+01:00" },
};

async function withFetch<T>(
  fake: typeof fetch,
  fn: () => Promise<T>,
): Promise<T> {
  const original = globalThis.fetch;
  const log = console.log;
  globalThis.fetch = fake;
  console.log = () => {}; // silence the structured logs
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
    console.log = log;
  }
}

// A fetch that never resolves by itself, but honours its abort signal.
const hangingFetch =
  (calls: { n: number }): typeof fetch =>
  (_url, init) => {
    calls.n++;
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(init.signal!.reason),
      );
    });
  };

Deno.test(
  "a hung LLM call times out and is retried 3 times in total",
  async () => {
    const calls = { n: 0 };
    const sleeps: number[] = [];
    const error = await withFetch(hangingFetch(calls), () =>
      assertRejects(() =>
        extractRehearsalFields("test-key", event, {
          timeoutMs: 20,
          sleep: (ms) => {
            sleeps.push(ms);
            return Promise.resolve();
          },
        }),
      ),
    );
    assertEquals(calls.n, 3);
    assertEquals(sleeps, [500, 1000]);
    assertEquals(
      (error as Error).message,
      "OpenAI request timed out after 20 ms.",
    );
  },
);

Deno.test("the request carries an abort signal", async () => {
  let signal: AbortSignal | null | undefined;
  const ok = JSON.stringify({
    choices: [
      {
        message: {
          content: JSON.stringify({
            is_rehearsal: true,
            name: "Répétition Hommes",
            place: "Salle test",
            group_type: "Hommes",
          }),
        },
      },
    ],
  });
  const result = await withFetch(
    (_url, init) => {
      signal = init?.signal;
      return Promise.resolve(new Response(ok, { status: 200 }));
    },
    () => extractRehearsalFields("test-key", event),
  );
  assertEquals(result.group_type, "Hommes");
  assertEquals(signal instanceof AbortSignal, true);
});

Deno.test("a timeout followed by a success still succeeds", async () => {
  let n = 0;
  const ok = JSON.stringify({
    choices: [
      {
        message: {
          content: JSON.stringify({
            is_rehearsal: false,
            name: "Concert",
            place: "Salle test",
            group_type: "Tous",
          }),
        },
      },
    ],
  });
  const result = await withFetch(
    (_url, init) => {
      if (n++ === 0) {
        return new Promise((_res, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal!.reason),
          ),
        );
      }
      return Promise.resolve(new Response(ok, { status: 200 }));
    },
    () =>
      extractRehearsalFields("test-key", event, {
        timeoutMs: 20,
        sleep: () => Promise.resolve(),
      }),
  );
  assertEquals(n, 2);
  assertEquals(result.is_rehearsal, false);
});
