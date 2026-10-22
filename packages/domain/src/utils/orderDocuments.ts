// The order form a buyer handed in (« bon de commande »), attached to their
// order in the admin and downloaded by the member from « Mes commandes »:
// rules shared by the admin, the website and their tests (no I/O). The file
// lives in the private bucket order-documents under <order id>/; the columns
// are orders.document_* (migration 20261022142528_member_orders.sql).

import { fileSizeLabel } from "./documents";
import {
  contentMatchesType,
  EXCEL_TYPES,
  MB,
  normalizeMimeType,
  PDF_TYPES,
  WORD_TYPES,
} from "./uploads";

export const ORDER_DOCUMENTS_BUCKET = "order-documents";

/** Largest file the admin accepts; the bucket says the same. */
export const ORDER_DOCUMENT_MAX_BYTES = 10 * MB;

/** Allowed MIME type → extension; same list as the table's CHECK. */
export const ORDER_DOCUMENT_TYPES: Readonly<Record<string, string>> = {
  ...PDF_TYPES,
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  ...WORD_TYPES,
  ...EXCEL_TYPES,
};

const TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    Object.entries(ORDER_DOCUMENT_TYPES).map(([type, ext]) => [ext, type]),
  ),
  jpeg: "image/jpeg",
};

/** The file picker's `accept`. */
export const ORDER_DOCUMENT_ACCEPT = [
  ...Object.keys(TYPE_BY_EXTENSION).map((ext) => `.${ext}`),
  ...Object.keys(ORDER_DOCUMENT_TYPES),
].join(",");

/** Same rule as the table's CHECK constraint. */
export const ORDER_DOCUMENT_FILE_NAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]*\.(pdf|jpg|png|webp|doc|docx|xls|xlsx)$/;
const FILE_NAME_MAX = 150;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * The content type of an order form from its name, or null when it isn't a
 * PDF, a photo (JPEG, PNG, WebP), a Word or an Excel file. Browsers often
 * send an empty or generic type for Office files, so the extension decides.
 */
export function orderDocumentMimeType(fileName: string): string | null {
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
 * The URL-safe name the file gets, with the extension of its type: « Bon
 * de commande Léa.JPEG » → `Bon-de-commande-Lea.jpg`. Null for a type that
 * isn't allowed.
 */
export function orderDocumentFileName(source: string): string | null {
  const type = orderDocumentMimeType(source);
  if (!type) return null;
  const extension = ORDER_DOCUMENT_TYPES[type]!;
  const base = asciiWords(source.slice(0, -(extensionOf(source).length + 1)))
    .slice(0, FILE_NAME_MAX - extension.length - 1)
    .replace(/-+$/, "");
  return `${base || "bon-de-commande"}.${extension}`;
}

/** Object key for a new upload; unique, never the raw name. */
export function orderDocumentStorageKey(
  orderId: string,
  fileName: string,
  id: string,
): string {
  return `${orderId}/${id}-${fileName}`;
}

/** True when `storageKey` is a file of this order (no sub-folder, no `..`). */
export function isOrderDocumentKey(storageKey: string, orderId: string) {
  const prefix = `${orderId}/`;
  return (
    storageKey.startsWith(prefix) &&
    storageKey.length > prefix.length &&
    storageKey.length <= 400 &&
    !storageKey.slice(prefix.length).includes("/") &&
    !storageKey.includes("..")
  );
}

export type OrderDocumentKind = "PDF" | "Photo" | "Word" | "Excel";

/** « PDF », « Photo », « Word » or « Excel ». */
export function orderDocumentKind(mimeType: string): OrderDocumentKind {
  const type = normalizeMimeType(mimeType);
  if (type.startsWith("image/")) return "Photo";
  if (Object.hasOwn(WORD_TYPES, type)) return "Word";
  if (Object.hasOwn(EXCEL_TYPES, type)) return "Excel";
  return "PDF";
}

/** « PDF · 240 ko », the line under a download button. */
export function orderDocumentDetails(document: {
  mime_type: string;
  size_bytes: number | null;
}): string {
  const size = fileSizeLabel(document.size_bytes);
  const kind = orderDocumentKind(document.mime_type);
  return size ? `${kind} · ${size}` : kind;
}

/** True when the file's first bytes match its type (a PDF starts with %PDF-…). */
export function orderDocumentContentMatches(
  mimeType: string,
  bytes: Uint8Array,
): boolean {
  const type = normalizeMimeType(mimeType);
  return (
    Object.hasOwn(ORDER_DOCUMENT_TYPES, type) && contentMatchesType(type, bytes)
  );
}

/** Why `file` can't be attached, or null when it can. */
export function orderDocumentProblem(file: {
  name: string;
  size: number;
}): string | null {
  if (!orderDocumentMimeType(file.name)) {
    return "Choisissez un PDF, une photo (JPEG, PNG, WebP), un fichier Word ou Excel.";
  }
  if (file.size === 0) return "Le fichier est vide.";
  if (file.size > ORDER_DOCUMENT_MAX_BYTES) return "Le fichier dépasse 10 Mo.";
  return null;
}
