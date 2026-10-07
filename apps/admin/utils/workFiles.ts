// utils/workFiles.ts
// Pure rules for the work files of « Espace de travail » (the old Storage
// explorer, `programs` bucket), unit-tested in workFiles.test.ts. The bucket
// itself enforces the same size and type list (migration
// 20261007100000_programs_bucket_limits.sql), so these only give a clear
// message before the upload starts and pick the content type the bucket
// checks.

import { AUDIO_TYPES, IMAGE_TYPES, MB, PDF_TYPES, WORD_TYPES } from "./uploads";

export const WORK_FILE_MAX_BYTES = 50 * MB;

/** Allowed MIME type → usual extension. Must match the bucket's allowed_mime_types. */
export const WORK_FILE_TYPES: Readonly<Record<string, string>> = {
  ...PDF_TYPES,
  ...IMAGE_TYPES,
  "image/heic": "heic",
  "image/heif": "heif",
  ...AUDIO_TYPES,
  "audio/midi": "mid",
  "audio/x-midi": "mid",
  "application/vnd.recordare.musicxml+xml": "musicxml",
  "application/vnd.recordare.musicxml": "mxl",
  "text/plain": "txt",
  ...WORD_TYPES,
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "application/vnd.oasis.opendocument.presentation": "odp",
};

/**
 * Browsers often send no type (or a generic one) for scores and MIDI files,
 * so these extensions name the type instead.
 */
const TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  mid: "audio/midi",
  midi: "audio/midi",
  musicxml: "application/vnd.recordare.musicxml+xml",
  mxl: "application/vnd.recordare.musicxml",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
};

/** The file picker's `accept`: every allowed extension. */
export const WORK_FILE_ACCEPT = Object.keys(TYPE_BY_EXTENSION)
  .map((extension) => `.${extension}`)
  .join(",");

/** Types that say nothing about the content: the extension decides. */
const GENERIC_TYPES = new Set(["", "application/octet-stream"]);

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * The content type to upload a work file with, or null when the bucket would
 * refuse it. A declared type is used when allowed; an empty or generic one
 * falls back to the extension. SVG, HTML and generic XML are never allowed
 * (they can carry scripts); MusicXML has its own types.
 */
export function workFileContentType(file: {
  name: string;
  type: string;
}): string | null {
  const declared = (file.type.split(";")[0] ?? "").trim().toLowerCase();
  if (Object.hasOwn(WORK_FILE_TYPES, declared)) return declared;
  if (!GENERIC_TYPES.has(declared)) return null;
  const extension = extensionOf(file.name);
  return Object.hasOwn(TYPE_BY_EXTENSION, extension)
    ? TYPE_BY_EXTENSION[extension]!
    : null;
}

export type WorkFileCheck =
  { ok: true; contentType: string } | { ok: false; error: string };

/** Same limits as the bucket, with a message the admin can act on. */
export function checkWorkFile(file: {
  name: string;
  type: string;
  size: number;
}): WorkFileCheck {
  if (file.size <= 0) return { ok: false, error: "Le fichier est vide" };
  if (file.size > WORK_FILE_MAX_BYTES) {
    return {
      ok: false,
      error: `Le fichier est trop volumineux (max ${WORK_FILE_MAX_BYTES / MB} Mo)`,
    };
  }
  const contentType = workFileContentType(file);
  if (!contentType) {
    return {
      ok: false,
      error:
        "Type de fichier non autorisé (PDF, images, audio, MIDI, MusicXML ou documents bureautiques)",
    };
  }
  return { ok: true, contentType };
}

/**
 * A Storage key segment from a file name. Storage refuses keys with accents
 * and most punctuation (« Répétition n°2.pdf » fails), so the name is reduced
 * to ASCII letters, digits, dots, dashes and underscores. The original name
 * stays in `files.original_name`.
 */
export function storageSafeName(name: string): string {
  const ascii = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+|_+$/g, "");
  const safe = ascii.slice(-120);
  return safe.length > 0 ? safe : "fichier";
}

/** Where a work file is stored: `<program>/<group>/<timestamp>_<safe name>`. */
export function workFileStoragePath(
  programId: string,
  groupId: string,
  fileName: string,
  now: number,
): string {
  return `${programId}/${groupId}/${now}_${storageSafeName(fileName)}`;
}

/** Storage removes at most 1,000 objects per request. */
export const STORAGE_REMOVE_BATCH = 1000;

/**
 * The object paths to remove when a folder is deleted, in batches Storage
 * accepts. Paths come from the `files` rows (uploads are not stored under a
 * folder prefix), without blanks or duplicates.
 */
export function storagePathBatches(
  files: readonly { storage_path: string | null }[],
  batchSize = STORAGE_REMOVE_BATCH,
): string[][] {
  const paths = [
    ...new Set(
      files
        .map((file) => file.storage_path?.trim() ?? "")
        .filter((path) => path.length > 0),
    ),
  ];
  const batches: string[][] = [];
  for (let i = 0; i < paths.length; i += batchSize) {
    batches.push(paths.slice(i, i + batchSize));
  }
  return batches;
}
