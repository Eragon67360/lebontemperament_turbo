import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The member's own files in Storage, removed before their account is deleted
 * (#354): the database rows go with the account (foreign keys, migration
 * 20261008230000), but Storage objects do not.
 *
 * - `profile-pictures`: uploads are named `<user id>_<timestamp>.<ext>` at the
 *   bucket's root (`api/users/profile-picture`).
 * - `bug-screenshots`: the paths listed on the member's own bug reports.
 *
 * Best effort: a failure is logged and the deletion goes on, since a
 * leftover file is less harm than an account that cannot be deleted.
 */
export function profilePictureFilesOf(
  userId: string,
  names: readonly string[],
): string[] {
  return names.filter((name) => name.startsWith(`${userId}_`));
}

export async function removeMemberFiles(
  db: SupabaseClient,
  userId: string,
): Promise<void> {
  try {
    const { data, error } = await db.storage
      .from("profile-pictures")
      .list("", { search: `${userId}_`, limit: 100 });
    if (error) throw error;
    const pictures = profilePictureFilesOf(
      userId,
      (data ?? []).map((file) => file.name),
    );
    if (pictures.length > 0) {
      const { error: removeError } = await db.storage
        .from("profile-pictures")
        .remove(pictures);
      if (removeError) throw removeError;
    }
  } catch (error) {
    console.error("[users] Profile pictures not removed:", error);
  }

  try {
    const { data, error } = await db
      .from("bug_reports")
      .select("screenshot_paths")
      .eq("reported_by", userId);
    if (error) throw error;
    const paths = (data ?? []).flatMap(
      (report: { screenshot_paths: string[] | null }) =>
        report.screenshot_paths ?? [],
    );
    if (paths.length > 0) {
      const { error: removeError } = await db.storage
        .from("bug-screenshots")
        .remove(paths);
      if (removeError) throw removeError;
    }
  } catch (error) {
    console.error("[users] Bug screenshots not removed:", error);
  }
}
