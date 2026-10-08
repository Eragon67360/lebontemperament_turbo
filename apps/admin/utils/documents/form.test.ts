import assert from "node:assert/strict";
import { fromFormDate, guessFromFileName, toFormDate } from "./form";
import { restorableFields, revisionSummary } from "./history";
import {
  UPLOAD_KEY_PATTERN,
  documentCreateSchema,
  documentPatchSchema,
} from "./schemas";
import { sizeFromContentRange } from "./storage";

// Stored → form → stored round trips.
for (const [date, precision] of [
  ["2025-06-21", "day"],
  ["2024-08-01", "month"],
  ["2024-01-01", "year"],
] as const) {
  const form = toFormDate(date, precision);
  const back = fromFormDate(form);
  assert.ok(back.ok);
  assert.deepEqual(back.value, {
    document_date: date,
    date_precision: precision,
  });
}
assert.deepEqual(toFormDate(null, null), { precision: "none", value: "" });
assert.deepEqual(fromFormDate({ precision: "none", value: "x" }), {
  ok: true,
  value: { document_date: null, date_precision: null },
});
assert.equal(fromFormDate({ precision: "day", value: "2025-02-30" }).ok, false);
assert.equal(fromFormDate({ precision: "month", value: "2025-13" }).ok, false);
assert.equal(fromFormDate({ precision: "year", value: "25" }).ok, false);

// Guesses from file names.
assert.deepEqual(guessFromFileName("gazette_2025_06_21.pdf"), {
  title: "gazette 2025 06 21",
  date: { precision: "day", value: "2025-06-21" },
});
assert.deepEqual(guessFromFileName("CR AG 2024.PDF").date, {
  precision: "year",
  value: "2024",
});
assert.deepEqual(guessFromFileName("pm_2.pdf").date, {
  precision: "none",
  value: "",
});

// Upload keys: only what the admin's upload produces.
assert.match(
  "documents/ag/0b6c1a52-3d1e-4c7a-9a7e-1f2d3c4b5a69-CR-2025.pdf",
  UPLOAD_KEY_PATTERN,
);
for (const bad of [
  "pdf/AG/x.pdf",
  "documents/ag/../x.pdf",
  "documents/AG/0b6c1a52-3d1e-4c7a-9a7e-1f2d3c4b5a69-x.pdf",
  "documents/ag/0b6c1a52-3d1e-4c7a-9a7e-1f2d3c4b5a69-x.html",
  "documents/ag/x.pdf",
]) {
  assert.doesNotMatch(bad, UPLOAD_KEY_PATTERN, bad);
}

// Create and patch bodies.
const valid = {
  collection_id: "0b6c1a52-3d1e-4c7a-9a7e-1f2d3c4b5a69",
  title: "Gazette",
  file_name: "Gazette.pdf",
  storage_key:
    "documents/gazettes/0b6c1a52-3d1e-4c7a-9a7e-1f2d3c4b5a69-Gazette.pdf",
  document_date: "2025-06-21",
  date_precision: "day",
  visibility: "members",
};
assert.ok(documentCreateSchema.safeParse(valid).success);
assert.equal(
  documentCreateSchema.safeParse({ ...valid, date_precision: null }).success,
  false,
);
assert.equal(
  documentCreateSchema.safeParse({ ...valid, status: "published" }).success,
  false,
);
assert.equal(
  documentCreateSchema.safeParse({ ...valid, title: "  " }).success,
  false,
);
assert.equal(
  documentCreateSchema.safeParse({ ...valid, visibility: "secret" }).success,
  false,
);
assert.ok(documentPatchSchema.safeParse({ status: "archived" }).success);
assert.equal(documentPatchSchema.safeParse({}).success, false);
assert.equal(
  documentPatchSchema.safeParse({ document_date: "2025-01-01" }).success,
  false,
);
assert.equal(
  documentPatchSchema.safeParse({ collection_id: valid.collection_id }).success,
  false,
);
assert.equal(
  documentPatchSchema.safeParse({ file_name: "x.pdf" }).success,
  false,
);

// Content-Range totals.
assert.equal(sizeFromContentRange("bytes 0-7/176959"), 176959);
assert.equal(sizeFromContentRange("bytes 0-7/*"), null);
assert.equal(sizeFromContentRange(null), null);

// History.
const row = {
  id: "x",
  title: "Gazette",
  document_date: "2025-06-21",
  date_precision: "day",
  visibility: "public",
  status: "archived",
  archived_at: "2026-10-08T00:00:00Z",
  storage_key: "pdf/Gazettes/g.pdf",
  size_bytes: 10,
  collection_id: "c",
  file_name: "g.pdf",
};
assert.deepEqual(Object.keys(restorableFields(row)!).sort(), [
  "archived_at",
  "date_precision",
  "document_date",
  "size_bytes",
  "status",
  "storage_key",
  "title",
  "visibility",
]);
assert.equal(restorableFields({ ...row, visibility: "secret" }), null);
assert.equal(restorableFields(null), null);
assert.equal(
  revisionSummary(row),
  "« Gazette » · 21/06/2025 · Public · archivé",
);

console.log("documents form: all assertions passed");
