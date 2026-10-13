import { checkAuthorization } from "@/utils/auth";
import { editorNames, isMissingTable } from "@/utils/siteSettings/server";
import { createClient } from "@/utils/supabase/server";
import {
  isSiteSettingKey,
  parseSiteSetting,
} from "@repo/domain/utils/siteSettings";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ key: string }> };

/**
 * GET: the setting's previous values, newest first (« Historique »). Only
 * versions that still pass today's rules are listed, so restoring one is an
 * ordinary save through PUT.
 */
export async function GET(_request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const key = (await params).key;
  if (!isSiteSettingKey(key)) {
    return NextResponse.json({ error: "Réglage inconnu" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: row, error: rowError } = await supabase
    .from("site_settings")
    .select("id")
    .eq("key", key)
    .maybeSingle();
  if (rowError) {
    if (isMissingTable(rowError)) return NextResponse.json([]);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!row) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("content_revisions")
    .select("id, old_row, changed_by, changed_at")
    .eq("table_name", "site_settings")
    .eq("row_id", row.id)
    .order("changed_at", { ascending: false })
    .limit(20);
  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const names = await editorNames(
    supabase,
    data.map((revision) => revision.changed_by),
  );
  const versions = data.flatMap((revision) => {
    const old = revision.old_row as { value?: unknown } | null;
    const parsed = parseSiteSetting(key, old?.value);
    if (!parsed.ok) return [];
    return [
      {
        id: revision.id,
        // The version that was replaced at `changedAt`.
        changedAt: revision.changed_at,
        changedBy: revision.changed_by
          ? (names[revision.changed_by] ?? null)
          : null,
        value: parsed.value,
      },
    ];
  });
  return NextResponse.json(versions);
}
