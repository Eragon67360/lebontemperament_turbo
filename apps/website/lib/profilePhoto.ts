// A member's own profile photo, changed from the app (Profil › Photo de
// profil) through /api/profile/photo. Members have no write access to
// `profiles` or to the bucket: the route checks who is calling, then writes
// with the service role, and only ever the caller's own row and file. The
// name and every other column stay out of reach.
import type { Database } from "@repo/domain/database.types";
import {
  ownProfilePictureFile,
  PROFILE_PICTURE_BUCKET,
  PROFILE_PICTURE_RULE,
  profilePictureFileName,
} from "@repo/domain/utils/profilePicture";
import { validateUpload } from "@repo/domain/utils/uploads";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient<Database>;

/** What the photo routes need from Supabase, so tests can fake it. */
export type ProfilePhotoStore = {
  /** The caller's current photo URL; `found` is false without a profile. */
  current(userId: string): Promise<{ found: boolean; url: string | null }>;
  upload(
    name: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<boolean>;
  publicUrl(name: string): string;
  setUrl(userId: string, url: string | null): Promise<boolean>;
  remove(name: string): Promise<void>;
};

export type PhotoResult = {
  status: number;
  body: { url: string | null } | { error: string };
};

const NO_PROFILE: PhotoResult = {
  status: 403,
  body: { error: "Aucun profil de membre pour ce compte" },
};

const SAVE_FAILED: PhotoResult = {
  status: 500,
  body: { error: "La photo n'a pas pu être enregistrée" },
};

/**
 * `caller` acts as the member (row-level security applies, so it only sees
 * their own profile row); `admin` is the service-role client used for the
 * writes.
 */
export function supabasePhotoStore(
  caller: Client,
  admin: Client,
): ProfilePhotoStore {
  const bucket = () => admin.storage.from(PROFILE_PICTURE_BUCKET);
  return {
    async current(userId) {
      const { data, error } = await caller
        .from("profiles")
        .select("profile_picture_url")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw new Error(`profile read failed: ${error.message}`);
      return { found: data !== null, url: data?.profile_picture_url ?? null };
    },
    async upload(name, bytes, contentType) {
      const { error } = await bucket().upload(name, bytes, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });
      if (error) console.error("Profile photo upload error:", error.message);
      return !error;
    },
    publicUrl: (name) => bucket().getPublicUrl(name).data.publicUrl,
    async setUrl(userId, url) {
      const { error } = await admin
        .from("profiles")
        .update({ profile_picture_url: url })
        .eq("id", userId);
      if (error) console.error("Profile photo update error:", error.message);
      return !error;
    },
    async remove(name) {
      const { error } = await bucket().remove([name]);
      // The new photo is saved either way; an orphan file is harmless.
      if (error) console.error("Profile photo cleanup error:", error.message);
    },
  };
}

/** Stores [bytes] as [userId]'s photo and deletes their previous upload. */
export async function replaceProfilePhoto(
  store: ProfilePhotoStore,
  userId: string,
  file: { type: string; size: number },
  bytes: Uint8Array,
  now: number = Date.now(),
): Promise<PhotoResult> {
  const check = validateUpload(file, bytes, PROFILE_PICTURE_RULE);
  if (!check.ok) return { status: 400, body: { error: check.error } };

  const before = await store.current(userId);
  if (!before.found) return NO_PROFILE;

  const name = profilePictureFileName(userId, check.extension, now);
  if (!(await store.upload(name, bytes, check.mimeType))) return SAVE_FAILED;

  const url = store.publicUrl(name);
  if (!(await store.setUrl(userId, url))) {
    await store.remove(name);
    return SAVE_FAILED;
  }

  const previous = ownProfilePictureFile(before.url, userId);
  if (previous && previous !== name) await store.remove(previous);
  return { status: 200, body: { url } };
}

/** Clears [userId]'s photo, deleting the file when it is their upload. */
export async function removeProfilePhoto(
  store: ProfilePhotoStore,
  userId: string,
): Promise<PhotoResult> {
  const before = await store.current(userId);
  if (!before.found) return NO_PROFILE;
  if (!(await store.setUrl(userId, null))) return SAVE_FAILED;

  const previous = ownProfilePictureFile(before.url, userId);
  if (previous) await store.remove(previous);
  return { status: 200, body: { url: null } };
}
