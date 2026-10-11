// Files attached to events (« bulletin de réservation », programme…): rules
// shared by the admin, the website and their tests (no I/O). The table is
// public.event_documents; the files live in the public bucket site-media
// under events/<event id>/ (migration 20261011190000_event_documents.sql).

import type { EventDocumentLink } from "../types/events";
import { fileSizeLabel } from "./documents";
import {
  contentMatchesType,
  EXCEL_TYPES,
  MB,
  normalizeMimeType,
  PDF_TYPES,
  WORD_TYPES,
} from "./uploads";

/** Largest file the admin accepts (the bucket allows 50 MB). */
export const EVENT_DOCUMENT_MAX_BYTES = 20 * MB;

/** Allowed MIME type → extension; same list as the table's CHECK. */
export const EVENT_DOCUMENT_TYPES: Readonly<Record<string, string>> = {
  ...PDF_TYPES,
  ...WORD_TYPES,
  ...EXCEL_TYPES,
};

const TYPE_BY_EXTENSION: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(EVENT_DOCUMENT_TYPES).map(([type, ext]) => [ext, type]),
);

/** The file picker's `accept`. */
export const EVENT_DOCUMENT_ACCEPT = [
  ...Object.keys(TYPE_BY_EXTENSION).map((ext) => `.${ext}`),
  ...Object.keys(EVENT_DOCUMENT_TYPES),
].join(",");

/** Same rules as the table's CHECK constraints. */
export const EVENT_DOCUMENT_FILE_NAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]*\.(pdf|doc|docx|xls|xlsx)$/;
export const EVENT_DOCUMENT_LABEL_MAX = 120;
const FILE_NAME_MAX = 150;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * The content type of an event file from its name, or null when it isn't a
 * PDF, Word or Excel file. Browsers often send an empty or generic type for
 * Office files, so the extension decides.
 */
export function eventDocumentMimeType(fileName: string): string | null {
  const extension = extensionOf(fileName);
  return Object.hasOwn(TYPE_BY_EXTENSION, extension)
    ? TYPE_BY_EXTENSION[extension]!
    : null;
}

/** ASCII words joined by `-`: accents dropped, everything else a separator. */
function asciiWords(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The URL-safe name a file gets, keeping its extension: « Bulletin de
 * réservation.DOCX » → `Bulletin-de-reservation.docx`. Null for a type that
 * isn't allowed.
 */
export function eventDocumentFileName(source: string): string | null {
  const extension = extensionOf(source);
  if (!Object.hasOwn(TYPE_BY_EXTENSION, extension)) return null;
  const base = asciiWords(source.slice(0, -(extension.length + 1)))
    .slice(0, FILE_NAME_MAX - extension.length - 1)
    .replace(/-+$/, "");
  return `${base || "document"}.${extension}`;
}

/** A label to start from: the file's name without its extension. */
export function eventDocumentDefaultLabel(source: string): string {
  const extension = extensionOf(source);
  const base = Object.hasOwn(TYPE_BY_EXTENSION, extension)
    ? source.slice(0, -(extension.length + 1))
    : source;
  const label = base.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return label.slice(0, EVENT_DOCUMENT_LABEL_MAX);
}

/** Object key in site-media for a new upload; unique, never the raw name. */
export function eventDocumentStorageKey(
  eventId: string,
  fileName: string,
  id: string,
): string {
  return `events/${eventId}/${id}-${fileName}`;
}

/** True when `storageKey` is a file of this event. */
export function isEventDocumentKey(storageKey: string, eventId: string) {
  const prefix = `events/${eventId}/`;
  return (
    storageKey.startsWith(prefix) &&
    storageKey.length > prefix.length &&
    !storageKey.slice(prefix.length).includes("/") &&
    !storageKey.includes("..")
  );
}

/** « PDF », « Word » or « Excel ». */
export function eventDocumentKind(mimeType: string): "PDF" | "Word" | "Excel" {
  const type = normalizeMimeType(mimeType);
  if (Object.hasOwn(WORD_TYPES, type)) return "Word";
  if (Object.hasOwn(EXCEL_TYPES, type)) return "Excel";
  return "PDF";
}

/** True when the file's first bytes match its type (a PDF starts with %PDF-…). */
export function eventDocumentContentMatches(
  mimeType: string,
  bytes: Uint8Array,
): boolean {
  const type = normalizeMimeType(mimeType);
  return (
    Object.hasOwn(EVENT_DOCUMENT_TYPES, type) && contentMatchesType(type, bytes)
  );
}

/**
 * Public address of an event file in the bucket of `supabaseUrl`. A PDF
 * opens in the browser; Word and Excel files download under their clean
 * name.
 */
export function eventDocumentUrl(
  supabaseUrl: string,
  document: { storage_key: string; file_name: string; mime_type: string },
): string {
  const encoded = document.storage_key
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const url = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/site-media/${encoded}`;
  return eventDocumentKind(document.mime_type) === "PDF"
    ? url
    : `${url}?download=${encodeURIComponent(document.file_name)}`;
}

type Sortable = { sort_order: number; created_at: string };

/** In the order the admin set, then oldest first. */
export function sortEventDocuments<T extends Sortable>(documents: T[]): T[] {
  return [...documents].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0),
  );
}

/** The files of one event as the website and the app show them, in order. */
export function eventDocumentLinks(
  supabaseUrl: string,
  documents: Array<{
    id: string;
    label: string;
    file_name: string;
    storage_key: string;
    mime_type: string;
    size_bytes: number | null;
    sort_order: number;
    created_at: string;
  }>,
): EventDocumentLink[] {
  return sortEventDocuments(documents).map((document) => ({
    id: document.id,
    label: document.label,
    kind: eventDocumentKind(document.mime_type),
    size: fileSizeLabel(document.size_bytes),
    url: eventDocumentUrl(supabaseUrl, document),
  }));
}

/** The columns readers select. */
export const EVENT_DOCUMENT_COLUMNS =
  "id, event_id, label, file_name, storage_key, mime_type, size_bytes, sort_order, created_at";
