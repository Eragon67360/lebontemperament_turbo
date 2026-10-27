// Run with `npm test -w website` (tsx, no framework, like apps/admin).
import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import {
  insertPendingMemory,
  type MemorySubmission,
  parseMemoryYear,
  pendingMemoryRow,
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

// Sharing a memory (#743): the form's insert runs with the visitor's own
// session, which may insert but not read the table. So the row carries an id
// chosen by the server, the insert never reads the row back (an insert that
// returned the row would be refused as a whole), and that id is what the
// route answers with.
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type Insert = { table: string; row: Record<string, unknown> };

/** A client whose insert records the row and refuses any read-back. */
function fakeClient(
  inserts: Insert[],
  error: { message: string } | null = null,
) {
  return {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row });
          return {
            select() {
              throw new Error(
                "the insert must not read the row back: the visitor's session has no SELECT policy on anniversary_memories",
              );
            },
            then<T>(
              resolve: (value: { data: null; error: typeof error }) => T,
            ) {
              return Promise.resolve({ data: null, error }).then(resolve);
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient<Database>;
}

{
  const memory = pendingMemoryRow({
    name: "  Prénom NOM ",
    email: " Memoire@Example.com ",
    message: " Un souvenir de test. ",
    year: "1999",
  });
  assert.match(memory.id, UUID_V4, "the server chooses the memory's id");
  assert.notEqual(
    pendingMemoryRow({ name: "a", email: "a@example.com", message: "m" }).id,
    memory.id,
    "each memory gets its own id",
  );
  assert.deepEqual(memory, {
    id: memory.id,
    name: "Prénom NOM",
    email: "memoire@example.com",
    message: "Un souvenir de test.",
    year: 1999,
    is_approved: false,
    is_featured: false,
  });

  const inserts: Insert[] = [];
  const { error } = await insertPendingMemory(fakeClient(inserts), memory);
  assert.equal(error, null);
  assert.deepEqual(
    inserts,
    [{ table: "anniversary_memories", row: memory }],
    "one insert, carrying the id and the pending flags, nothing read back",
  );
  assert.equal(inserts[0]!.row.id, memory.id, "the insert carries the id");
}

{
  // Whatever the form sends, a new memory starts pending.
  const claimed = {
    name: "Prénom NOM",
    email: "memoire@example.com",
    message: "Un souvenir.",
    is_approved: true,
    is_featured: true,
  } as MemorySubmission;
  const memory = pendingMemoryRow(claimed);
  assert.equal(memory.is_approved, false);
  assert.equal(memory.is_featured, false);
}

{
  // The database's refusal reaches the route as an error, not an exception.
  const inserts: Insert[] = [];
  const refused = { message: "new row violates row-level security policy" };
  const { error } = await insertPendingMemory(
    fakeClient(inserts, refused),
    pendingMemoryRow({
      name: "Prénom NOM",
      email: "memoire@example.com",
      message: "Un souvenir.",
    }),
  );
  assert.deepEqual(error, refused);
  assert.equal(inserts.length, 1);
}

// The year: a whole number, or null when empty or not a number.
assert.equal(parseMemoryYear("1999"), 1999);
assert.equal(parseMemoryYear(2005), 2005);
assert.equal(parseMemoryYear(""), null);
assert.equal(parseMemoryYear(undefined), null);
assert.equal(parseMemoryYear(null), null);
assert.equal(parseMemoryYear("bientôt"), null);

console.log("anniversaryMemories: all assertions passed");
