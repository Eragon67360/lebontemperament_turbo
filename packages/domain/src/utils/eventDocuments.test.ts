import assert from "node:assert/strict";
import {
  EVENT_DOCUMENT_FILE_NAME_PATTERN,
  eventDocumentContentMatches,
  eventDocumentDefaultLabel,
  eventDocumentFileName,
  eventDocumentKind,
  eventDocumentLinks,
  eventDocumentMimeType,
  eventDocumentStorageKey,
  eventDocumentUrl,
  isEventDocumentKey,
  sortEventDocuments,
} from "./eventDocuments";

const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Types come from the extension; anything else is refused.
assert.equal(eventDocumentMimeType("Bulletin.pdf"), "application/pdf");
assert.equal(eventDocumentMimeType("Bulletin.DOCX"), DOCX);
assert.equal(eventDocumentMimeType("tarifs.xls"), "application/vnd.ms-excel");
assert.equal(eventDocumentMimeType("tarifs.xlsx"), XLSX);
assert.equal(eventDocumentMimeType("photo.png"), null);
assert.equal(eventDocumentMimeType("page.html"), null);
assert.equal(eventDocumentMimeType("constructor"), null);
assert.equal(eventDocumentMimeType("x.constructor"), null);

// File names: URL-safe, accents dropped, extension kept in lower case.
assert.equal(
  eventDocumentFileName("Bulletin de réservation (fromages).DOCX"),
  "Bulletin-de-reservation-fromages.docx",
);
assert.equal(eventDocumentFileName("¿¿.xlsx"), "document.xlsx");
assert.equal(eventDocumentFileName("x.svg"), null);
assert.equal(eventDocumentFileName("x".repeat(400) + ".pdf")!.length, 150);
for (const name of ["Bulletin de réservation.pdf", "--a__b--.xls", "é.doc"]) {
  assert.match(
    eventDocumentFileName(name)!,
    EVENT_DOCUMENT_FILE_NAME_PATTERN,
    name,
  );
}

assert.equal(
  eventDocumentDefaultLabel("Bulletin_de_réservation.pdf"),
  "Bulletin de réservation",
);

// Storage keys stay inside the event's folder.
const event = "4b1f9a54-0d5e-4b8e-9d4a-0c1a3f9b2e11";
const key = eventDocumentStorageKey(event, "a.pdf", "id1");
assert.equal(key, `events/${event}/id1-a.pdf`);
assert.ok(isEventDocumentKey(key, event));
assert.ok(!isEventDocumentKey(`events/${event}/`, event));
assert.ok(!isEventDocumentKey(`events/${event}/x/a.pdf`, event));
assert.ok(!isEventDocumentKey(`events/other/a.pdf`, event));
assert.ok(!isEventDocumentKey(`documents/${event}/a.pdf`, event));

assert.equal(eventDocumentKind("application/pdf"), "PDF");
assert.equal(eventDocumentKind("application/msword"), "Word");
assert.equal(eventDocumentKind(XLSX), "Excel");

// Content must match the type.
const bytes = (s: string) => new TextEncoder().encode(s);
assert.ok(eventDocumentContentMatches("application/pdf", bytes("%PDF-1.7")));
assert.ok(!eventDocumentContentMatches("application/pdf", bytes("<html>")));
assert.ok(eventDocumentContentMatches(DOCX, bytes("PK\x03\x04rest")));
assert.ok(eventDocumentContentMatches(XLSX, bytes("PK\x03\x04rest")));
const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
assert.ok(eventDocumentContentMatches("application/vnd.ms-excel", ole));
assert.ok(!eventDocumentContentMatches("application/msword", bytes("PK")));
assert.ok(!eventDocumentContentMatches("image/png", bytes("%PDF-")));

// URLs: PDFs open, Office files download under their name.
const base = "https://example.supabase.co/";
assert.equal(
  eventDocumentUrl(base, {
    storage_key: "events/e/1-a b.pdf",
    file_name: "a.pdf",
    mime_type: "application/pdf",
  }),
  "https://example.supabase.co/storage/v1/object/public/site-media/events/e/1-a%20b.pdf",
);
assert.equal(
  eventDocumentUrl(base, {
    storage_key: "events/e/1-Bulletin.docx",
    file_name: "Bulletin.docx",
    mime_type: DOCX,
  }),
  "https://example.supabase.co/storage/v1/object/public/site-media/events/e/1-Bulletin.docx?download=Bulletin.docx",
);

assert.deepEqual(
  sortEventDocuments([
    { id: "c", sort_order: 1, created_at: "2026-01-01" },
    { id: "b", sort_order: 0, created_at: "2026-01-02" },
    { id: "a", sort_order: 0, created_at: "2026-01-01" },
  ]).map((d) => d.id),
  ["a", "b", "c"],
);

assert.deepEqual(
  eventDocumentLinks(base, [
    {
      id: "2",
      label: "Tarifs",
      file_name: "Tarifs.xlsx",
      storage_key: "events/e/2-Tarifs.xlsx",
      mime_type: XLSX,
      size_bytes: null,
      sort_order: 1,
      created_at: "2026-10-11",
    },
    {
      id: "1",
      label: "Bulletin de réservation",
      file_name: "Bulletin.pdf",
      storage_key: "events/e/1-Bulletin.pdf",
      mime_type: "application/pdf",
      size_bytes: 120 * 1024,
      sort_order: 0,
      created_at: "2026-10-11",
    },
  ]),
  [
    {
      id: "1",
      label: "Bulletin de réservation",
      kind: "PDF",
      size: "120 ko",
      url: "https://example.supabase.co/storage/v1/object/public/site-media/events/e/1-Bulletin.pdf",
    },
    {
      id: "2",
      label: "Tarifs",
      kind: "Excel",
      size: null,
      url: "https://example.supabase.co/storage/v1/object/public/site-media/events/e/2-Tarifs.xlsx?download=Tarifs.xlsx",
    },
  ],
);

console.log("eventDocuments: ok");
