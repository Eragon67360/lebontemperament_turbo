// « Documents de l'association »: rules shared by the admin, the website and
// their tests (no I/O). The table is public.site_documents; its PDFs live in
// the public bucket site-media under documents/<collection>/.

/** Largest PDF the admin accepts (the bucket allows 50 MB). */
export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

/** Same rules as the table's CHECK constraints. */
export const COLLECTION_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const DOCUMENT_FILE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/;
export const DOCUMENT_TITLE_MAX = 200;
export const COLLECTION_LABEL_MAX = 80;
export const COLLECTION_DESCRIPTION_MAX = 300;
const FILE_NAME_MAX = 150;
const SLUG_MAX = 40;

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** ASCII words joined by `sep`: accents dropped, everything else a separator. */
function asciiWords(value: string, sep: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, sep)
    .replace(new RegExp(`^\\${sep}+|\\${sep}+$`, "g"), "");
}

/**
 * The URL-safe file name a new document gets, from the uploaded file's name
 * or its title: « Compte rendu AG 2025.pdf » → `Compte-rendu-AG-2025.pdf`.
 */
export function documentFileName(source: string): string {
  const base = asciiWords(source.replace(/\.pdf$/i, ""), "-").slice(
    0,
    FILE_NAME_MAX - 4,
  );
  return `${base.replace(/-+$/, "") || "document"}.pdf`;
}

/** `name.pdf`, `name-2.pdf`, … : the first one not in `taken`. */
export function uniqueFileName(name: string, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, (n) => n.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  const base = name.replace(/\.pdf$/, "");
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}.pdf`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

/** A collection slug from its label: « Programmes de concert » → `programmes-de-concert`. */
export function collectionSlug(label: string): string {
  return asciiWords(label, "-")
    .toLowerCase()
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

/** Object key in site-media for a new upload; unique, never the raw name. */
export function documentStorageKey(
  collectionSlugValue: string,
  fileName: string,
  id: string,
): string {
  return `documents/${collectionSlugValue}/${id}-${fileName}`;
}

/** The document's address on the website. */
export function documentPath(
  collectionSlugValue: string,
  fileName: string,
): string {
  return `/documents/${encodeURIComponent(collectionSlugValue)}/${encodeURIComponent(fileName)}`;
}

/**
 * The date as members read it: 21/06/2025 (day), août 2024 (month), 2024
 * (year); null without a date.
 */
export function documentDateLabel(
  date: string | null | undefined,
  precision: string | null | undefined,
): string | null {
  if (!date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return null;
  const [, year, month, day] = match;
  if (precision === "year") return year!;
  if (precision === "month")
    return `${MONTHS[Number(month) - 1] ?? month} ${year}`;
  return `${day}/${month}/${year}`;
}

type Sortable = {
  document_date: string | null;
  sort_order: number;
  title: string;
};

/**
 * Newest first; documents without a date after the dated ones; then the
 * higher `sort_order` first (a gazette before its supplement), then by title.
 */
export function sortDocuments<T extends Sortable>(documents: T[]): T[] {
  return [...documents].sort((a, b) => {
    if (a.document_date !== b.document_date) {
      if (!a.document_date) return 1;
      if (!b.document_date) return -1;
      return a.document_date < b.document_date ? 1 : -1;
    }
    if (a.sort_order !== b.sort_order) return b.sort_order - a.sort_order;
    return a.title.localeCompare(b.title, "fr");
  });
}

/** True when the first bytes are a PDF's (`%PDF-`). */
export function looksLikePdf(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

/** « 1,2 Mo », « 850 ko »: sizes as the admin shows them. */
export function fileSizeLabel(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes < 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
