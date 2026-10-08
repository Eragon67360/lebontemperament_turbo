import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { FAQ_COLUMNS, faqPatchSchema } from "@/utils/joining/schemas";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const idSchema = z.guid();
const unknown = () =>
  NextResponse.json({ error: "Question inconnue" }, { status: 404 });

/** PATCH: edit, move (`sort_order`), hide (`archived`) or put back. */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return unknown();

  const parsed = parsePatchBody(faqPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faq_items")
    .update({ ...parsed.data, updated_by: auth.user.id })
    .eq("id", id.data)
    .select(FAQ_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Error updating faq_items row:", error);
    return NextResponse.json(
      { error: "La question n'a pas pu être modifiée" },
      { status: 500 },
    );
  }
  if (!data) return unknown();

  revalidateWebsiteAfterResponse(REVALIDATE.faq);
  return NextResponse.json(data);
}

/** Deletes for good: superadmins only (admins hide). */
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
    .from("faq_items")
    .delete()
    .eq("id", id.data)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("Error deleting faq_items row:", error);
    return NextResponse.json(
      { error: "La suppression a échoué" },
      { status: 500 },
    );
  }
  if (!data) return unknown();

  if (data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.faq);
  }
  return new NextResponse(null, { status: 204 });
}
