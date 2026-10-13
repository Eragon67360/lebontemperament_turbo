// « Réglages du site »: what the routes share. The rules for each value live
// in @repo/domain/utils/siteSettings.
import type { AdminRole } from "@/utils/access";
import type { createClient } from "@/utils/supabase/server";
import {
  type SiteSettingKey,
  SUPERADMIN_SETTING_KEYS,
} from "@repo/domain/utils/siteSettings";

/** When and by whom a setting was last saved (GET /api/site-settings). */
export type SavedSetting = { updatedAt: string; updatedBy: string | null };

type Client = Awaited<ReturnType<typeof createClient>>;

/** 42P01 / PGRST205: the migration isn't applied on this database yet. */
export function isMissingTable(error: { code?: string | null } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export const NOT_INSTALLED_MESSAGE =
  "Les réglages du site ne sont pas encore installés sur cette base.";

/** Whether `role` may change `key` (the contact details: superadmins only). */
export function canEditSetting(key: SiteSettingKey, role: AdminRole): boolean {
  return role === "superadmin" || !SUPERADMIN_SETTING_KEYS.includes(key);
}

/** Display names of the given accounts, for « Modifié par … ». */
export async function editorNames(
  supabase: Client,
  ids: readonly (string | null)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);
  if (error || !data) return {};
  return Object.fromEntries(
    data
      .filter((profile) => profile.display_name)
      .map((profile) => [profile.id, profile.display_name as string]),
  );
}
