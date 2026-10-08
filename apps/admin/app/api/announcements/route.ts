import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { overLimitMessage } from "@/utils/announcements/limits";
import {
  ANNOUNCEMENT_COLUMNS,
  announcementCreateSchema,
} from "@/utils/announcements/schemas";
import { checkAuthorization } from "@/utils/auth";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * « Annonces » (public.site_announcements).
 * GET: every announcement, archived ones included, and whether the caller
 * may delete for good (superadmins).
 * POST: a new announcement; a published one must fit the placement's limit.
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    // 42P01 / PGRST205: the migration isn't applied on this database yet.
    const missing = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        error: missing
          ? "Les annonces ne sont pas encore installées sur cette base."
          : "Erreur serveur",
        notInstalled: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  return NextResponse.json({
    announcements: data,
    canDelete: auth.role === "superadmin",
  });
}

export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(
    announcementCreateSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  const supabase = await createClient();
  if (body.status === "published") {
    const { data: others, error } = await supabase
      .from("site_announcements")
      .select("starts_on, ends_on")
      .eq("placement", body.placement)
      .eq("status", "published");
    if (error) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
    const refusal = overLimitMessage(body.placement, body, others);
    if (refusal) {
      return NextResponse.json({ error: refusal }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from("site_announcements")
    .insert({ ...body, created_by: auth.user.id, updated_by: auth.user.id })
    .select(ANNOUNCEMENT_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "L'annonce n'a pas pu être enregistrée" },
      { status: 500 },
    );
  }

  if (data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.announcements);
  }
  return NextResponse.json(data, { status: 201 });
}
