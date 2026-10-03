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

// Submitted faster than a person can type.
assert.equal(detectFormAbuse({ fillTimeMs: MIN_FILL_TIME_MS - 1 }), "too-fast");
assert.equal(detectFormAbuse({ fillTimeMs: 0 }), "too-fast");
assert.equal(detectFormAbuse({ fillTimeMs: -5 }), "too-fast");
assert.equal(detectFormAbuse({ fillTimeMs: "1200" }), "too-fast");

// No usable measurement (a page loaded before this check, a failed script):
// never drop a real person's message; the honeypot still applies.
for (const body of [{}, null, "text", { website: "" }, { fillTimeMs: "" }]) {
  assert.equal(detectFormAbuse(body), "human");
}
assert.equal(detectFormAbuse({ fillTimeMs: "soon" }), "human");
assert.equal(detectFormAbuse({ fillTimeMs: Infinity }), "human");
assert.equal(
  detectFormAbuse({ website: "x", fillTimeMs: undefined }),
  "honeypot",
);

console.log("detectFormAbuse: all assertions passed");
