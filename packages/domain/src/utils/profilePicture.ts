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

// Photos that other people's browsers load straight from their host (the
// members directory, the admin's members list): only the association's own
// Storage and Google account pictures.

/**
 * A Google account picture: https on a googleusercontent.com subdomain
 * (lh3.googleusercontent.com), the avatar Google sign-in keeps in an
 * account's metadata. member_directory_with_avatars() and
 * auth_user_summaries() apply the same pattern in the database
 * (supabase/migrations/20261026192418_directory_avatar_hosts.sql): keep the
 * two in step.
 */
const GOOGLE_AVATAR =
  /^https:\/\/([a-z0-9-]+\.)+googleusercontent\.com(\/\S*)?$/i;

/** [url] when it is a Google account picture, otherwise null. */
export function googleAvatarUrl(url: unknown): string | null {
  return typeof url === "string" && GOOGLE_AVATAR.test(url) ? url : null;
}

const STORAGE_PUBLIC_PATH = "/storage/v1/object/public/";

function originOf(base: string | null | undefined): string | null {
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

/**
 * The photo to show for a member, or null for their initials: a public file
 * in the association's Storage on one of [storageOrigins] (the Supabase URLs
 * the photos are stored under), or a Google account picture. No other
 * address is loaded.
 */
export function memberPhotoUrl(
  url: string | null | undefined,
  storageOrigins: readonly (string | null | undefined)[],
): string | null {
  if (!url) return null;
  if (googleAvatarUrl(url)) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.username || parsed.password) return null;
  if (!parsed.pathname.startsWith(STORAGE_PUBLIC_PATH)) return null;
  return storageOrigins.some((base) => originOf(base) === parsed.origin)
    ? url
    : null;
}
