import assert from "node:assert/strict";
import {
  DEFAULT_DENSITY,
  densityAttribute,
  isDensity,
  parseDensity,
} from "./density";

// Known values pass through.
assert.equal(parseDensity("comfortable"), "comfortable");
assert.equal(parseDensity("compact"), "compact");
assert.equal(isDensity("compact"), true);

// Anything else (old keys, tampering, nothing stored) falls back.
assert.equal(parseDensity(null), DEFAULT_DENSITY);
assert.equal(parseDensity(undefined), DEFAULT_DENSITY);
assert.equal(parseDensity(""), DEFAULT_DENSITY);
assert.equal(parseDensity("Compact"), DEFAULT_DENSITY);
assert.equal(parseDensity("dense"), DEFAULT_DENSITY);
assert.equal(parseDensity(42), DEFAULT_DENSITY);
assert.equal(isDensity(["compact"]), false);

// The attribute is only set for the non-default value, so the CSS default
// rules apply without any attribute at all.
assert.equal(densityAttribute("comfortable"), undefined);
assert.equal(densityAttribute("compact"), "compact");

console.log("density: ok");
