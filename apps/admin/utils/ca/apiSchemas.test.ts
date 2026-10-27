// What /api/cas accepts (CODE-004): what the page sends, and nothing else.
import assert from "node:assert/strict";
import { parsePatchBody } from "../anniversary/patchSchemas";
import { caCreateSchema, caDeleteSchema, caPatchSchema } from "./apiSchemas";

const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
const PDF =
  "https://placeholder.supabase.co/storage/v1/object/public/ca-documents/1761500000000-cr.pdf";

// --- What app/dashboard/admin/ca/page.tsx sends is accepted, as sent ---
for (const body of [
  { title: "CA d'octobre", date_from: "2026-10-12", file_url: PDF },
  { title: "CA d'octobre", date_from: "2026-10-12", file_url: null },
]) {
  assert.deepEqual(parsePatchBody(caCreateSchema, body), {
    ok: true,
    data: body,
  });
}
// The title is trimmed; the PDF may be left out.
assert.deepEqual(
  parsePatchBody(caCreateSchema, { title: "  CA  ", date_from: "2026-10-12" }),
  { ok: true, data: { title: "CA", date_from: "2026-10-12" } },
);

// --- Columns the page never sends are refused, by name ---
for (const column of ["created_by", "id", "created_at", "updated_at"]) {
  assert.deepEqual(
    parsePatchBody(caCreateSchema, {
      title: "CA",
      date_from: "2026-10-12",
      [column]: ID,
    }),
    {
      ok: false,
      status: 400,
      error: `Champs non modifiables : ${column}`,
    },
    column,
  );
}
assert.deepEqual(
  parsePatchBody(caPatchSchema, { id: ID, title: "CA", created_by: ID }),
  { ok: false, status: 400, error: "Champs non modifiables : created_by" },
);

// --- Wrong or missing values, by field ---
const refusals: [unknown, string][] = [
  [{ date_from: "2026-10-12" }, "Champs invalides : title"],
  [{ title: "   ", date_from: "2026-10-12" }, "Champs invalides : title"],
  [{ title: "CA", date_from: "12/10/2026" }, "Champs invalides : date_from"],
  [
    { title: "CA", date_from: "2026-10-12", file_url: "javascript:alert(1)" },
    "Champs invalides : file_url",
  ],
  [
    { title: "CA", date_from: "2026-10-12", file_url: "/cr.pdf" },
    "Champs invalides : file_url",
  ],
  [undefined, "Corps de requête invalide"],
  [[], "Corps de requête invalide"],
];
for (const [body, error] of refusals) {
  assert.deepEqual(
    parsePatchBody(caCreateSchema, body),
    { ok: false, status: 400, error },
    JSON.stringify(body),
  );
}

// --- PATCH: the id and at least one field ---
assert.deepEqual(parsePatchBody(caPatchSchema, { id: ID, file_url: null }), {
  ok: true,
  data: { id: ID, file_url: null },
});
assert.deepEqual(parsePatchBody(caPatchSchema, { id: ID }), {
  ok: false,
  status: 400,
  error: "Aucun champ à modifier",
});
assert.deepEqual(parsePatchBody(caPatchSchema, { id: "1", title: "CA" }), {
  ok: false,
  status: 400,
  error: "Champs invalides : id",
});

// --- DELETE: `{ id }` only ---
assert.deepEqual(parsePatchBody(caDeleteSchema, { id: ID }), {
  ok: true,
  data: { id: ID },
});
assert.deepEqual(parsePatchBody(caDeleteSchema, { id: "x" }), {
  ok: false,
  status: 400,
  error: "Champs invalides : id",
});
assert.deepEqual(parsePatchBody(caDeleteSchema, { id: ID, title: "CA" }), {
  ok: false,
  status: 400,
  error: "Champs non modifiables : title",
});

console.log("ca apiSchemas: all assertions passed");
