// Profile pictures in the public `profile-pictures` bucket: one file per
// upload, named `<user id>_<timestamp>.<ext>` by both the admin's
// /api/users/profile-picture and the website's /api/profile/photo (which the
// app calls when a member changes their own photo).
import { IMAGE_TYPES, isUuid, MB, type UploadRule } from "./uploads";

export const PROFILE_PICTURE_BUCKET = "profile-pictures";

/** JPEG, PNG, WebP, GIF, AVIF (no SVG), 5 MB max. */
export const PROFILE_PICTURE_RULE: UploadRule = {
  types: IMAGE_TYPES,
  maxBytes: 5 * MB,
};

/** Name of a new profile picture file for [userId]. */
export function profilePictureFileName(
  userId: string,
  extension: string,
  now: number = Date.now(),
): string {
  return `${userId}_${now}.${extension}`;
}

const EXTENSIONS = new Set(Object.values(IMAGE_TYPES));

/**
 * The file name behind a stored profile picture URL, when that file is
 * [userId]'s own upload in the profile pictures bucket; otherwise null.
 * Replacing a photo deletes the previous file only when this says it is
 * theirs, so a URL pointing elsewhere (a Google avatar, another member's
 * file, a crafted value) never deletes anything.
 */
export function ownProfilePictureFile(
  url: string | null | undefined,
  userId: string,
): string | null {
  if (!url || !isUuid(userId)) return null;
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return null;
  }
  const prefix = `/storage/v1/object/public/${PROFILE_PICTURE_BUCKET}/`;
  if (!path.startsWith(prefix)) return null;
  const name = path.slice(prefix.length);
  const match = /^([0-9a-f-]{36})_\d{1,16}\.([a-z]{3,4})$/i.exec(name);
  if (!match || match[1]!.toLowerCase() !== userId.toLowerCase()) return null;
  return EXTENSIONS.has(match[2]!.toLowerCase()) ? name : null;
}
