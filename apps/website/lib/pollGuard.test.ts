// Run with: npx tsx lib/pollGuard.test.ts
import assert from "node:assert/strict";
import { createPollGuard } from "./pollGuard";

let now = 1_700_000_000_000;
const guard = createPollGuard(30_000, () => now);

// One request at a time: the second is refused until the first settles.
const first = guard.begin();
assert.equal(first, 1);
now += 10_000;
assert.equal(guard.begin(), null, "refused while the first is pending");
assert.equal(guard.settle(first), true, "the first answer applies");
assert.equal(guard.begin(), 2, "allowed once the first settled");
assert.equal(guard.settle(2), true);

// An answer that failed still settles its request.
const third = guard.begin();
assert.equal(third, 3);
assert.equal(guard.settle(third), true);
assert.equal(guard.begin(), 4);
assert.equal(guard.settle(4), true);

// A request pending for the limit no longer blocks; its late answer is
// stale and the newer one applies.
const stuck = guard.begin();
assert.equal(stuck, 5);
now += 29_999;
assert.equal(guard.begin(), null, "still pending just under the limit");
now += 1;
const retry = guard.begin();
assert.equal(retry, 6, "allowed at the limit");
assert.equal(guard.settle(stuck), false, "the late answer is dropped");
assert.equal(guard.begin(), null, "the retry is still pending");
assert.equal(guard.settle(retry), true, "the retry's answer applies");
assert.equal(guard.begin(), 7);

// Settling a request twice, or an unknown one, changes nothing.
assert.equal(guard.settle(7), true);
assert.equal(guard.settle(7), true);
assert.equal(guard.settle(99), false);
assert.equal(guard.begin(), 8);

console.log("pollGuard: all tests passed");
