import { checkAuthorization } from "@/utils/auth";
import {
  canEditSetting,
  editorNames,
  isMissingTable,
  NOT_INSTALLED_MESSAGE,
  type SavedSetting,
} from "@/utils/siteSettings/server";
import { createClient } from "@/utils/supabase/server";
import {
  readSiteSettings,
  SITE_SETTING_KEYS,
  type SiteSettingKey,
} from "@repo/domain/utils/siteSettings";
import { NextResponse } from "next/server";

/**
 * « Réglages du site »: GET returns every setting as the website shows it (a
 * key never saved, or saved with a value that is no longer valid, shows its
 * default), when and by whom each was last saved, and which ones the caller
 * may change (the contact details: superadmins only).
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, updated_at, updated_by");

  if (error) {
    const missing = isMissingTable(error);
    if (!missing) console.error("Error reading site_settings:", error);
    return NextResponse.json(
      {
        error: missing ? NOT_INSTALLED_MESSAGE : "Erreur serveur",
        notInstalled: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  const { settings, invalid } = readSiteSettings(data);
  const names = await editorNames(
    supabase,
    data.map((row) => row.updated_by),
  );
  const saved: Partial<Record<SiteSettingKey, SavedSetting>> = {};
  for (const row of data) {
    if (!SITE_SETTING_KEYS.includes(row.key as SiteSettingKey)) continue;
    saved[row.key as SiteSettingKey] = {
      updatedAt: row.updated_at,
      updatedBy: row.updated_by ? (names[row.updated_by] ?? null) : null,
    };
  }
  const editable = Object.fromEntries(
    SITE_SETTING_KEYS.map((key) => [key, canEditSetting(key, auth.role)]),
  ) as Record<SiteSettingKey, boolean>;

  return NextResponse.json({ settings, saved, invalid, editable });
}
