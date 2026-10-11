import assert from "node:assert/strict";
import {
  eventDocumentCreateSchema,
  eventDocumentDeleteSchema,
  eventDocumentPatchSchema,
} from "./documents";

const EVENT = "4b1f9a54-0d5e-4b8e-9d4a-0c1a3f9b2e11";
const valid = {
  event_id: EVENT,
  label: "Bulletin de réservation",
  file_name: "Bulletin.docx",
  storage_key: `events/${EVENT}/5f0c2c4e-8f53-4a3b-9b8e-2d0f1a7c6b55-Bulletin.docx`,
  mime_type:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

assert.ok(eventDocumentCreateSchema.safeParse(valid).success);

// The file must sit in the event's own folder.
for (const storage_key of [
  `events/other/x-Bulletin.docx`,
  `documents/ag/x-Bulletin.docx`,
  `events/${EVENT}/../x.docx`,
  `events/${EVENT}/a/b.docx`,
]) {
  assert.ok(
    !eventDocumentCreateSchema.safeParse({ ...valid, storage_key }).success,
    storage_key,
  );
}

// Name and type agree; only PDF, Word and Excel.
assert.ok(
  !eventDocumentCreateSchema.safeParse({
    ...valid,
    mime_type: "application/pdf",
  }).success,
);
assert.ok(
  !eventDocumentCreateSchema.safeParse({
    ...valid,
    file_name: "page.html",
    mime_type: "text/html",
  }).success,
);
assert.ok(
  !eventDocumentCreateSchema.safeParse({ ...valid, label: "   " }).success,
);
// Unknown keys are refused.
assert.ok(
  !eventDocumentCreateSchema.safeParse({ ...valid, size_bytes: 1 }).success,
);

assert.ok(
  eventDocumentPatchSchema.safeParse({ id: EVENT, label: "Tarifs" }).success,
);
assert.ok(
  !eventDocumentPatchSchema.safeParse({ id: EVENT, label: "x", sort_order: 1 })
    .success,
);
assert.ok(eventDocumentDeleteSchema.safeParse({ id: EVENT }).success);
assert.ok(!eventDocumentDeleteSchema.safeParse({ id: "x" }).success);

console.log("event documents: all assertions passed");
