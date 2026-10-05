// Run with `npm test -w website` (tsx, no framework, like apps/admin).
import assert from "node:assert/strict";
import {
  PUBLIC_MEMORY_COLUMNS,
  PUBLIC_MEMORY_SELECT,
  toPublicMemory,
} from "./anniversaryMemories";

// The public select list never names the author's email.
assert.ok(
  !PUBLIC_MEMORY_COLUMNS.includes("email"),
  "public memory columns must not include email",
);
assert.ok(
  !/email/i.test(PUBLIC_MEMORY_SELECT),
  "public memory select must not mention email",
);
assert.deepEqual(PUBLIC_MEMORY_COLUMNS, [
  "id",
  "name",
  "message",
  "year",
  "is_featured",
  "created_at",
]);

// The mapper drops anything a row carries beyond the public columns.
const rowWithEmail = {
  id: "fixture-1",
  name: "Témoin Fictif",
  email: "memory-fixture@example.com",
  message: "Un souvenir de test.",
  year: 1999,
  is_featured: true,
  created_at: "2026-01-01T00:00:00Z",
  is_approved: true,
};
const memory = toPublicMemory(rowWithEmail);
assert.ok(!("email" in memory), "view-model must not carry email");
assert.ok(!("is_approved" in memory), "view-model must not carry flags");
assert.ok(
  !JSON.stringify(memory).includes("@"),
  "serialised memory must not contain an address",
);
assert.deepEqual(memory, {
  id: "fixture-1",
  name: "Témoin Fictif",
  message: "Un souvenir de test.",
  year: 1999,
  is_featured: true,
  created_at: "2026-01-01T00:00:00Z",
});

// Null flags from the database get safe defaults.
assert.deepEqual(
  toPublicMemory({
    id: "fixture-2",
    name: "Témoin Fictif",
    message: "Souvenir sans date.",
    year: null,
    is_featured: null,
    created_at: null,
  }),
  {
    id: "fixture-2",
    name: "Témoin Fictif",
    message: "Souvenir sans date.",
    year: null,
    is_featured: false,
    created_at: "",
  },
);

console.log("anniversaryMemories: all assertions passed");
