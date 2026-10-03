import assert from "node:assert/strict";
import { REVALIDATE, revalidateWebsite } from "./revalidateWebsite";

// Runs without a request context: only the plain `revalidateWebsite` is
// exercised (the `after` wrapper needs a Route Handler).

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const originalError = console.error;
const silence = () => {
  console.warn = () => {};
  console.error = () => {};
};
const restoreConsole = () => {
  console.warn = originalWarn;
  console.error = originalError;
};

function mockFetch(
  impl: (url: string, init: RequestInit) => Promise<Response>,
) {
  calls.length = 0;
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = String(input);
    calls.push({ url, init: init ?? {} });
    return impl(url, init ?? {});
  }) as typeof fetch;
}

async function main() {
  silence();

  // --- Not configured: nothing is called, the caller is told "no" ---
  delete process.env.REVALIDATE_SECRET;
  process.env.NEXT_PUBLIC_WEBSITE_URL = "https://www.example.com";
  mockFetch(async () => new Response("{}", { status: 200 }));
  assert.equal(await revalidateWebsite(REVALIDATE.agenda), false);
  assert.equal(calls.length, 0);

  process.env.REVALIDATE_SECRET = "test-secret-" + "x".repeat(20);
  delete process.env.NEXT_PUBLIC_WEBSITE_URL;
  assert.equal(await revalidateWebsite(REVALIDATE.agenda), false);
  assert.equal(calls.length, 0);

  // --- Configured: one POST with the secret header and the JSON body ---
  process.env.NEXT_PUBLIC_WEBSITE_URL = "https://www.example.com";
  mockFetch(
    async () =>
      new Response(JSON.stringify({ revalidated: true }), { status: 200 }),
  );
  assert.equal(await revalidateWebsite(REVALIDATE.stories), true);
  assert.equal(calls.length, 1);
  const [{ url, init }] = calls;
  assert.equal(url, "https://www.example.com/api/revalidate");
  assert.equal(init.method, "POST");
  const headers = init.headers as Record<string, string>;
  assert.equal(headers["x-revalidate-secret"], process.env.REVALIDATE_SECRET);
  assert.equal(headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(String(init.body)), {
    paths: [
      "/concerts",
      { path: "/concerts/[slug]", type: "page" },
      "/",
      "/sitemap.xml",
    ],
  });
  assert.ok(init.signal instanceof AbortSignal, "a timeout signal is set");

  // --- The website refuses: false, no throw ---
  mockFetch(async () => new Response("nope", { status: 401 }));
  assert.equal(await revalidateWebsite(REVALIDATE.videos), false);

  // --- Network failure / timeout: false, no throw ---
  mockFetch(async () => {
    throw new Error("fetch failed");
  });
  assert.equal(await revalidateWebsite(REVALIDATE.featureFlags), false);

  // --- Every change kind names at least one path or tag ---
  for (const [kind, request] of Object.entries(REVALIDATE)) {
    const paths = "paths" in request ? request.paths : [];
    const tags = "tags" in request ? request.tags : [];
    assert.ok(paths.length + tags.length > 0, `${kind} revalidates something`);
    for (const path of paths) {
      const value = typeof path === "string" ? path : path.path;
      assert.ok(value.startsWith("/"), `${kind}: ${value} starts with /`);
      if (value.includes("[")) {
        assert.ok(typeof path === "object", `${kind}: pattern needs a type`);
      }
    }
  }

  globalThis.fetch = originalFetch;
  restoreConsole();
  console.log("revalidateWebsite.test.ts: all assertions passed");
}

main().catch((error) => {
  globalThis.fetch = originalFetch;
  restoreConsole();
  console.error(error);
  process.exit(1);
});
