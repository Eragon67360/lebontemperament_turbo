// utils/uploads.ts
// Pure upload checks shared by the admin's and the website's upload routes
// (no I/O, unit-tested in apps/admin/utils/uploads.test.ts and
// uploads.test.ts here): allowed types, size caps, and content that must
// start like its declared type. The declared MIME type comes from the
// client, so the first bytes must also match it for images and documents;
// SVG is never accepted (it can carry scripts).

export const MB = 1024 * 1024;

/** Allowed MIME type → extension the stored file gets. */
export type TypeMap = Readonly<Record<string, string>>;

export const IMAGE_TYPES: TypeMap = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const PDF_TYPES: TypeMap = { "application/pdf": "pdf" };

export const WORD_TYPES: TypeMap = {
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

export type UploadRule = { types: TypeMap; maxBytes: number };

export function normalizeMimeType(type: string): string {
  return (type.split(";")[0] ?? "").trim().toLowerCase();
}

const startsWithBytes = (bytes: Uint8Array, signature: number[], at = 0) =>
  bytes.length >= at + signature.length &&
  signature.every((byte, i) => bytes[at + i] === byte);

const asciiAt = (bytes: Uint8Array, at: number, text: string) =>
  startsWithBytes(
    bytes,
    [...text].map((c) => c.charCodeAt(0)),
    at,
  );

const asciiWithin = (
  bytes: Uint8Array,
  from: number,
  to: number,
  text: string,
) => {
  for (let i = from; i <= Math.min(to, bytes.length - text.length); i++) {
    if (asciiAt(bytes, i, text)) return true;
  }
  return false;
};

/** Magic numbers of the image and document types (audio is not sniffed). */
const SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => startsWithBytes(b, [0xff, 0xd8, 0xff]),
  "image/png": (b) =>
    startsWithBytes(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/gif": (b) => asciiAt(b, 0, "GIF87a") || asciiAt(b, 0, "GIF89a"),
  "image/webp": (b) => asciiAt(b, 0, "RIFF") && asciiAt(b, 8, "WEBP"),
  "image/avif": (b) =>
    asciiAt(b, 4, "ftyp") &&
    (asciiWithin(b, 8, 64, "avif") || asciiWithin(b, 8, 64, "avis")),
  // The PDF header may follow a few bytes of junk (allowed in the first 1 KB).
  "application/pdf": (b) => asciiWithin(b, 0, 1024, "%PDF-"),
  "application/msword": (b) =>
    startsWithBytes(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
    b,
  ) => startsWithBytes(b, [0x50, 0x4b, 0x03, 0x04]),
};

export type UploadCheck =
  | { ok: true; mimeType: string; extension: string }
  | { ok: false; error: string };

/**
 * Checks a file against a route's rule: not empty, not over the size cap,
 * declared type in the allowlist, and (for images and documents) content
 * that starts like that type. `bytes` is the file content (only the first
 * kilobyte is read).
 */
export function validateUpload(
  file: { type: string; size: number },
  bytes: Uint8Array,
  rule: UploadRule,
): UploadCheck {
  if (file.size <= 0) return { ok: false, error: "Le fichier est vide" };
  if (file.size > rule.maxBytes) {
    return {
      ok: false,
      error: `Le fichier est trop volumineux (max ${Math.round(rule.maxBytes / MB)} Mo)`,
    };
  }
  const mimeType = normalizeMimeType(file.type);
  const extension = Object.hasOwn(rule.types, mimeType)
    ? rule.types[mimeType]
    : undefined;
  if (!extension) {
    return { ok: false, error: "Type de fichier non autorisé" };
  }
  const matches = SIGNATURES[mimeType];
  if (matches && !matches(bytes.subarray(0, 1100))) {
    return {
      ok: false,
      error: "Le contenu du fichier ne correspond pas à son type",
    };
  }
  return { ok: true, mimeType, extension };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** User ids name stored files, so they must be plain UUIDs. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
