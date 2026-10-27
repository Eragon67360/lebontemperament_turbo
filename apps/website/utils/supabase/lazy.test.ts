// Run with: npx tsx utils/supabase/lazy.test.ts
import assert from "node:assert/strict";
import { memoizeLoader } from "./lazy";

// A loader that fails on its first attempt (a chunk missing after a
// deployment, a flaky network) and succeeds afterwards: the shape of
// `import("./client")` behind `loadBrowserClient`.
let attempts = 0;
const load = memoizeLoader(async () => {
  attempts += 1;
  if (attempts === 1) throw new Error("Loading chunk failed");
  return { attempt: attempts };
});

// Callers waiting on the same attempt share it and all see its rejection.
const first = load();
assert.equal(load(), first);
await assert.rejects(first, /Loading chunk failed/);
assert.equal(attempts, 1);

// The failure is not kept: the next call loads again and succeeds.
const client = await load();
assert.deepEqual(client, { attempt: 2 });
assert.equal(attempts, 2);

// A successful load is shared by every later caller, with no new attempt.
assert.equal(await load(), client);
assert.equal(attempts, 2);

// A loader that keeps failing is retried on every call, not once.
let failures = 0;
const alwaysFailing = memoizeLoader(async () => {
  failures += 1;
  throw new Error(`attempt ${failures}`);
});
await assert.rejects(alwaysFailing(), /attempt 1/);
await assert.rejects(alwaysFailing(), /attempt 2/);
assert.equal(failures, 2);

console.log("lazy: all tests passed");
