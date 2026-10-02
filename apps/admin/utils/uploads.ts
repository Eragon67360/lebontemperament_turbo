// utils/uploads.ts
// Pure upload rules for the admin's upload routes (no I/O, unit-tested in
// uploads.test.ts): which types each route accepts, how large, into which
// Cloudinary folders. The declared MIME type comes from the browser, so the
// first bytes must also match it for images and documents; SVG is never
// accepted (it can carry scripts).

export const MB = 1024 * 1024;

/** Allowed MIME type → extension the stored file gets. */
type TypeMap = Readonly<Record<string, string>>;

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

export const AUDIO_TYPES: TypeMap = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
};

/** Cloudinary formats matching IMAGE_TYPES (Cloudinary checks the content). */
export const CLOUDINARY_IMAGE_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
];

export type UploadRule = { types: TypeMap; maxBytes: number };

export const UPLOAD_RULES = {
  /** /api/upload: concert and tour posters, CA documents (Supabase Storage). Same 5 MB as the FileUpload picker. */
  storage: { types: { ...IMAGE_TYPES, ...PDF_TYPES }, maxBytes: 5 * MB },
  /** /api/users/profile-picture (Supabase Storage). */
  profilePicture: { types: IMAGE_TYPES, maxBytes: 5 * MB },
  /** /api/cloudinary-upload: project images. */
  projectImage: { types: IMAGE_TYPES, maxBytes: 10 * MB },
  /** /api/anniversary/upload, resourceType "image". */
  anniversaryImage: { types: IMAGE_TYPES, maxBytes: 10 * MB },
  /** /api/anniversary/upload, resourceType "audio". */
  anniversaryAudio: { types: AUDIO_TYPES, maxBytes: 50 * MB },
  /** /api/anniversary/upload, resourceType "raw". Same 50 MB as FileUploader. */
  anniversaryDocument: {
    types: { ...PDF_TYPES, ...WORD_TYPES },
    maxBytes: 50 * MB,
  },
} satisfies Record<string, UploadRule>;

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

/** Project images: Site/concerts or Site/concerts/<slug>. */
const PROJECT_IMAGE_FOLDER = /^Site\/concerts(?:\/[A-Za-z0-9_-]{1,100})?$/;

export const PROJECT_IMAGE_DEFAULT_FOLDER = "Site/concerts";

export function isAllowedProjectImageFolder(folder: string): boolean {
  return PROJECT_IMAGE_FOLDER.test(folder);
}

/** Every folder the anniversary CMS uploads to. */
export const ANNIVERSARY_FOLDERS: readonly string[] = [
  "Site/anniversary",
  "Site/anniversary/photos",
  "Site/anniversary/audio",
  "Site/anniversary/archives",
  "Site/anniversary/videos/thumbnails",
];

export const ANNIVERSARY_DEFAULT_FOLDER = "Site/anniversary";

export function isAllowedAnniversaryFolder(folder: string): boolean {
  return ANNIVERSARY_FOLDERS.includes(folder);
}

/**
 * The folder to upload into: the default when none is given, the requested
 * one when the allowlist accepts it, otherwise null (refuse the upload).
 */
export function resolveUploadFolder(
  requested: unknown,
  defaultFolder: string,
  isAllowed: (folder: string) => boolean,
): string | null {
  if (requested === null || requested === undefined || requested === "") {
    return defaultFolder;
  }
  if (typeof requested !== "string") return null;
  return isAllowed(requested) ? requested : null;
}

export const ANNIVERSARY_KINDS = {
  image: { rule: UPLOAD_RULES.anniversaryImage, resourceType: "image" },
  audio: { rule: UPLOAD_RULES.anniversaryAudio, resourceType: "raw" },
  raw: { rule: UPLOAD_RULES.anniversaryDocument, resourceType: "raw" },
} as const;

export type AnniversaryKind = keyof typeof ANNIVERSARY_KINDS;

/**
 * Which anniversary rule applies: the `resourceType` the CMS sends ("image",
 * "audio" or "raw" for documents), or, when it sends none, the kind whose
 * allowlist contains the file's type. Anything else (e.g. "video") is null.
 */
export function anniversaryKind(
  resourceType: unknown,
  mimeType: string,
): AnniversaryKind | null {
  if (
    resourceType === "image" ||
    resourceType === "audio" ||
    resourceType === "raw"
  ) {
    return resourceType;
  }
  if (
    resourceType !== null &&
    resourceType !== undefined &&
    resourceType !== ""
  ) {
    return null;
  }
  const type = normalizeMimeType(mimeType);
  for (const kind of Object.keys(ANNIVERSARY_KINDS) as AnniversaryKind[]) {
    if (Object.hasOwn(ANNIVERSARY_KINDS[kind].rule.types, type)) return kind;
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** User ids name stored files, so they must be plain UUIDs. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
