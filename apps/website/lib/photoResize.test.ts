// Run with: npx tsx lib/photoResize.test.ts
import assert from "node:assert/strict";
import { fitWithin } from "./photoResize";

assert.deepEqual(fitWithin(4032, 3024), { width: 1024, height: 768 });
assert.deepEqual(fitWithin(3024, 4032), { width: 768, height: 1024 });
assert.deepEqual(fitWithin(500, 300), { width: 500, height: 300 });
assert.deepEqual(fitWithin(2048, 2048, 512), { width: 512, height: 512 });
assert.deepEqual(fitWithin(10000, 10), { width: 1024, height: 1 });
assert.deepEqual(fitWithin(0, 100), { width: 0, height: 0 });

console.log("photoResize: all tests passed");
