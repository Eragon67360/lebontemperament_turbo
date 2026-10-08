import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { overLimitMessage } from "@/utils/announcements/limits";
import {
  ANNOUNCEMENT_COLUMNS,
  announcementPatchSchema,
} from "@/utils/announcements/schemas";
import { checkAuthorization } from "@/utils/auth";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import type { AnnouncementPlacement } from "@repo/domain/utils/announcements";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const idSchema = z.guid();
const unknown = () =>
  NextResponse.json({ error: "Annonce inconnue" }, { status: 404 });

/** PATCH: edit, publish, take back as a draft, archive or put back. */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return unknown();

  const parsed = parsePatchBody(
    announcementPatchSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const patch = parsed.data;

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("site_announcements")
    .select("placement, starts_on, ends_on, status")
    .eq("id", id.data)
    .maybeSingle();
  if (currentError) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!current) return unknown();

  const next = { ...current, ...patch };
  if (next.starts_on && next.ends_on && next.starts_on > next.ends_on) {
    return NextResponse.json(
      { error: "Le début vient avant la fin" },
      { status: 400 },
    );
  }
  if (next.status === "published") {
    const { data: others, error } = await supabase
      .from("site_announcements")
      .select("starts_on, ends_on")
      .eq("placement", next.placement)
      .eq("status", "published")
      .neq("id", id.data);
    if (error) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
    const refusal = overLimitMessage(
      next.placement as AnnouncementPlacement,
      next,
      others,
    );
    if (refusal) {
      return NextResponse.json({ error: refusal }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from("site_announcements")
    .update({ ...patch, updated_by: auth.user.id })
    .eq("id", id.data)
    .select(ANNOUNCEMENT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "L'annonce n'a pas pu être modifiée" },
      { status: 500 },
    );
  }
  if (!data) return unknown();

  if (current.status === "published" || data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.announcements);
  }
  return NextResponse.json(data);
}

/** Deletes for good: superadmins only (admins archive). */
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.role !== "superadmin") {
    return NextResponse.json(
      { error: "Seuls les superadmins suppriment définitivement" },
      { status: 403 },
    );
  }
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return unknown();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .delete()
    .eq("id", id.data)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "La suppression a échoué" },
      { status: 500 },
    );
  }
  if (!data) return unknown();

  if (data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.announcements);
  }
  return new NextResponse(null, { status: 204 });
}
