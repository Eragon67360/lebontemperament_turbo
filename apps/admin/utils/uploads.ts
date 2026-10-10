// utils/uploads.ts
// Pure upload rules for the admin's upload routes (no I/O, unit-tested in
// uploads.test.ts): which types each route accepts, how large, into which
// Cloudinary folders. The type and content checks themselves are shared
// with the website (@repo/domain/utils/uploads).
import { PROFILE_PICTURE_RULE } from "@repo/domain/utils/profilePicture";
import {
  IMAGE_TYPES,
  MB,
  normalizeMimeType,
  PDF_TYPES,
  WORD_TYPES,
  type TypeMap,
  type UploadRule,
} from "@repo/domain/utils/uploads";

export {
  IMAGE_TYPES,
  isUuid,
  MB,
  normalizeMimeType,
  PDF_TYPES,
  validateUpload,
  WORD_TYPES,
  type UploadCheck,
  type UploadRule,
} from "@repo/domain/utils/uploads";

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

export const UPLOAD_RULES = {
  /** /api/upload: concert and tour posters, CA documents (Supabase Storage). Same 5 MB as the FileUpload picker. */
  storage: { types: { ...IMAGE_TYPES, ...PDF_TYPES }, maxBytes: 5 * MB },
  /** /api/users/profile-picture (Supabase Storage); the website's /api/profile/photo uses the same rule. */
  profilePicture: PROFILE_PICTURE_RULE,
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
