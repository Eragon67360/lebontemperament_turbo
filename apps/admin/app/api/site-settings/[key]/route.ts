import { readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import {
  canEditSetting,
  isMissingTable,
  NOT_INSTALLED_MESSAGE,
} from "@/utils/siteSettings/server";
import { createClient } from "@/utils/supabase/server";
import type { Json } from "@repo/domain/database.types";
import {
  isSiteSettingKey,
  parseSiteSetting,
} from "@repo/domain/utils/siteSettings";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ key: string }> };

/**
 * PUT `{ value }`: saves one setting after checking it with the website's own
 * rules (@repo/domain/utils/siteSettings). The contact details are
 * superadmin-only; the database enforces the same rule.
 */
export async function PUT(request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const key = (await params).key;
  if (!isSiteSettingKey(key)) {
    return NextResponse.json({ error: "Réglage inconnu" }, { status: 404 });
  }
  if (!canEditSetting(key, auth.role)) {
    return NextResponse.json(
      { error: "Seuls les superadmins modifient les coordonnées" },
      { status: 403 },
    );
  }

  const body = await readJson(request);
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    !("value" in body)
  ) {
    return NextResponse.json(
      { error: "Envoyez { value } et rien d'autre" },
      { status: 400 },
    );
  }
  const parsed = parseSiteSetting(key, (body as { value: unknown }).value);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        key,
        value: parsed.value as unknown as Json,
        updated_by: auth.user.id,
      },
      { onConflict: "key" },
    )
    .select("key, value, updated_at")
    .single();

  if (error) {
    const missing = isMissingTable(error);
    if (!missing) console.error("Error saving site_settings row:", error);
    return NextResponse.json(
      {
        error: missing
          ? NOT_INSTALLED_MESSAGE
          : "Le réglage n'a pas pu être enregistré",
        notInstalled: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  revalidateWebsiteAfterResponse(REVALIDATE.siteSettings);
  return NextResponse.json(data);
}
