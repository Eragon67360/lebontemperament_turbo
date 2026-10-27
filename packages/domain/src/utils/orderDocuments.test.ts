import assert from "node:assert/strict";
import {
  isOrderDocumentKey,
  ORDER_DOCUMENT_FILE_NAME_PATTERN,
  ORDER_DOCUMENT_MAX_BYTES,
  orderDocumentContentMatches,
  orderDocumentDetails,
  orderDocumentFileName,
  orderDocumentKind,
  orderDocumentMimeType,
  orderDocumentProblem,
  orderDocumentStorageKey,
} from "./orderDocuments";

const ORDER = "9fa48563-0afc-4ef6-85d2-2e4b8552ecfc";

// Types come from the extension; anything else is refused.
assert.equal(orderDocumentMimeType("bon.pdf"), "application/pdf");
assert.equal(orderDocumentMimeType("IMG_2041.JPEG"), "image/jpeg");
assert.equal(orderDocumentMimeType("scan.jpg"), "image/jpeg");
assert.equal(orderDocumentMimeType("scan.png"), "image/png");
assert.equal(orderDocumentMimeType("scan.webp"), "image/webp");
assert.equal(orderDocumentMimeType("bon.docx")?.includes("word"), true);
assert.equal(orderDocumentMimeType("bon.xls"), "application/vnd.ms-excel");
for (const name of ["photo.heic", "page.html", "x.svg", "constructor", "pdf"]) {
  assert.equal(orderDocumentMimeType(name), null, name);
}

// Names: URL-safe, accents dropped, the type's own extension.
assert.equal(
  orderDocumentFileName("Bon de commande Léa.JPEG"),
  "Bon-de-commande-Lea.jpg",
);
assert.equal(
  orderDocumentFileName("Bon de commande du chœur.PNG"),
  "Bon-de-commande-du-choeur.png",
);
assert.equal(orderDocumentFileName("¿¿.pdf"), "bon-de-commande.pdf");
assert.equal(orderDocumentFileName("x.heic"), null);
assert.equal(orderDocumentFileName("x".repeat(400) + ".pdf")!.length, 150);
for (const name of ["Bon de commande.pdf", "--a__b--.xlsx", "é.jpeg"]) {
  assert.match(orderDocumentFileName(name)!, ORDER_DOCUMENT_FILE_NAME_PATTERN);
}

// Keys: inside the order's folder only.
const key = orderDocumentStorageKey(ORDER, "bon.pdf", "abc");
assert.equal(key, `${ORDER}/abc-bon.pdf`);
assert.equal(isOrderDocumentKey(key, ORDER), true);
assert.equal(isOrderDocumentKey(`${ORDER}/`, ORDER), false);
assert.equal(isOrderDocumentKey(`${ORDER}/a/b.pdf`, ORDER), false);
assert.equal(isOrderDocumentKey(`${ORDER}/..pdf`, ORDER), false);
assert.equal(isOrderDocumentKey(`other/abc-bon.pdf`, ORDER), false);

// Kinds and the line under the button.
assert.equal(orderDocumentKind("image/png"), "Photo");
assert.equal(orderDocumentKind("application/msword"), "Word");
assert.equal(orderDocumentKind("application/pdf"), "PDF");
assert.equal(
  orderDocumentDetails({ mime_type: "application/pdf", size_bytes: 240_000 }),
  "PDF · 234 ko",
);
assert.equal(
  orderDocumentDetails({ mime_type: "image/jpeg", size_bytes: null }),
  "Photo",
);

// Content must start like its type.
const bytes = (...b: number[]) => new Uint8Array(b);
assert.equal(
  orderDocumentContentMatches("image/jpeg", bytes(0xff, 0xd8, 0xff, 0xe0)),
  true,
);
assert.equal(
  orderDocumentContentMatches("image/jpeg", new TextEncoder().encode("%PDF-1")),
  false,
);
assert.equal(
  orderDocumentContentMatches(
    "application/pdf",
    new TextEncoder().encode("%PDF-1.7"),
  ),
  true,
);
assert.equal(
  orderDocumentContentMatches("text/html", new TextEncoder().encode("<html>")),
  false,
);

// Problems, worded for the admin.
assert.equal(orderDocumentProblem({ name: "bon.pdf", size: 10 }), null);
assert.match(orderDocumentProblem({ name: "bon.heic", size: 10 })!, /PDF/);
assert.equal(
  orderDocumentProblem({ name: "bon.pdf", size: 0 }),
  "Le fichier est vide.",
);
assert.equal(
  orderDocumentProblem({ name: "bon.pdf", size: ORDER_DOCUMENT_MAX_BYTES + 1 }),
  "Le fichier dépasse 10 Mo.",
);

console.log("orderDocuments: ok");
