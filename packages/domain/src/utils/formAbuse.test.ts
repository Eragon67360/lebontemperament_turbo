import assert from "node:assert/strict";
import { detectFormAbuse, MIN_FILL_TIME_MS } from "./formAbuse";

// A person: empty honeypot, took a while.
assert.equal(
  detectFormAbuse({
    email: "member@example.com",
    message: "Bonjour",
    website: "",
    fillTimeMs: 12_000,
  }),
  "human",
);
assert.equal(detectFormAbuse({ fillTimeMs: MIN_FILL_TIME_MS }), "human");
assert.equal(detectFormAbuse({ fillTimeMs: "4500" }), "human");

// Honeypot filled: a bot, and it wins over the timing so bots learn nothing.
assert.equal(
  detectFormAbuse({ website: "https://example.com", fillTimeMs: 60_000 }),
  "honeypot",
);
assert.equal(detectFormAbuse({ website: 1, fillTimeMs: 60_000 }), "honeypot");

// Submitted faster than a person can type, or without the measurement.
assert.equal(detectFormAbuse({ fillTimeMs: MIN_FILL_TIME_MS - 1 }), "too-fast");
assert.equal(detectFormAbuse({ fillTimeMs: 0 }), "too-fast");
assert.equal(detectFormAbuse({ fillTimeMs: -5 }), "too-fast");
assert.equal(detectFormAbuse({ fillTimeMs: "soon" }), "too-fast");
assert.equal(detectFormAbuse({ fillTimeMs: Infinity }), "too-fast");
for (const body of [{}, null, "text", { website: "" }]) {
  assert.equal(detectFormAbuse(body), "too-fast");
}

console.log("detectFormAbuse: all assertions passed");
