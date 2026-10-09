import assert from "node:assert/strict";
import {
  COLLECTION_SLUG_PATTERN,
  collectionSlug,
  DOCUMENT_FILE_NAME_PATTERN,
  documentDateLabel,
  documentFileName,
  documentPath,
  documentStorageKey,
  fileSizeLabel,
  looksLikePdf,
  sortDocuments,
  uniqueFileName,
} from "./documents";

// File names: URL-safe, accents dropped, always .pdf, valid for the table.
assert.equal(
  documentFileName("Compte-Rendu Assemblée Générale 2025.pdf"),
  "Compte-Rendu-Assemblee-Generale-2025.pdf",
);
assert.equal(
  documentFileName("Gazette n°12 (été).PDF"),
  "Gazette-n-12-ete.pdf",
);
assert.equal(documentFileName("  ¿¿¿.pdf"), "document.pdf");
assert.equal(documentFileName("x".repeat(400)).length, 150);
for (const name of [
  "Compte-Rendu Assemblée Générale 2025.pdf",
  "--weird__name--.pdf",
  "é.pdf",
  "x".repeat(400),
]) {
  assert.match(documentFileName(name), DOCUMENT_FILE_NAME_PATTERN, name);
}

assert.equal(uniqueFileName("a.pdf", []), "a.pdf");
assert.equal(uniqueFileName("a.pdf", ["A.pdf"]), "a-2.pdf");
assert.equal(uniqueFileName("a.pdf", ["a.pdf", "a-2.pdf"]), "a-3.pdf");

// Collection slugs.
assert.equal(collectionSlug("Programmes de concert"), "programmes-de-concert");
assert.equal(collectionSlug("Pêle-Mêle !"), "pele-mele");
assert.match(
  collectionSlug("Textes de l'association"),
  COLLECTION_SLUG_PATTERN,
);
assert.equal(collectionSlug("x".repeat(60)).length, 40);

// Keys and paths.
assert.equal(
  documentStorageKey("ag", "CR-2025.pdf", "abc"),
  "documents/ag/abc-CR-2025.pdf",
);
assert.equal(documentPath("ag", "CR 2025.pdf"), "/documents/ag/CR%202025.pdf");

// Dates.
assert.equal(documentDateLabel("2025-06-21", "day"), "21/06/2025");
assert.equal(documentDateLabel("2024-08-18", "month"), "août 2024");
assert.equal(documentDateLabel("2024-01-01", "year"), "2024");
assert.equal(documentDateLabel(null, "day"), null);
assert.equal(documentDateLabel("not a date", "day"), null);

// Sorting: newest first, undated last, sort_order breaks ties.
const sorted = sortDocuments([
  { title: "PM 1", document_date: null, sort_order: 1 },
  { title: "Supplément", document_date: "2023-02-05", sort_order: 0 },
  { title: "Gazette 2025", document_date: "2025-06-21", sort_order: 0 },
  { title: "Gazette 2023", document_date: "2023-02-05", sort_order: 1 },
  { title: "PM 2", document_date: null, sort_order: 2 },
]);
assert.deepEqual(
  sorted.map((d) => d.title),
  ["Gazette 2025", "Gazette 2023", "Supplément", "PM 2", "PM 1"],
);

// PDF signature.
assert.equal(looksLikePdf(new TextEncoder().encode("%PDF-1.7\n")), true);
assert.equal(looksLikePdf(new TextEncoder().encode("<html>")), false);
assert.equal(looksLikePdf(new Uint8Array()), false);

// Sizes.
assert.equal(fileSizeLabel(176959), "173 ko");
assert.equal(fileSizeLabel(6142756), "5,9 Mo");
assert.equal(fileSizeLabel(null), null);

console.log("documents: all assertions passed");
