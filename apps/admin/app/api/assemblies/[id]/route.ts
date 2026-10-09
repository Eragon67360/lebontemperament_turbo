import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import {
  ASSEMBLY_COLUMNS,
  assemblyPatchSchema,
} from "@/utils/assemblies/schemas";
import { checkAuthorization } from "@/utils/auth";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const idSchema = z.guid();

/** PATCH: edit, publish (`status: "published"`) or take back as a draft. */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = idSchema.safeParse((await params).id);
  if (!id.success) {
    return NextResponse.json(
      { error: "Assemblée générale inconnue" },
      { status: 404 },
    );
  }

  const parsed = parsePatchBody(assemblyPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("general_assemblies")
    .update({ ...parsed.data, updated_by: auth.user.id })
    .eq("id", id.data)
    .select(ASSEMBLY_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Error updating general assembly:", error);
    return NextResponse.json(
      { error: "L'assemblée générale n'a pas pu être modifiée" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Assemblée générale inconnue" },
      { status: 404 },
    );
  }

  // A draft that stays a draft changes nothing on the website; anything
  // else (published, or just taken offline) does.
  if (data.status === "published" || parsed.data.status === "draft") {
    revalidateWebsiteAfterResponse(REVALIDATE.assemblies);
  }
  return NextResponse.json(data);
}

/** Deletes for good: superadmins only (admins put it back as a draft). */
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
  if (!id.success) {
    return NextResponse.json(
      { error: "Assemblée générale inconnue" },
      { status: 404 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("general_assemblies")
    .delete()
    .eq("id", id.data)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("Error deleting general assembly:", error);
    return NextResponse.json(
      { error: "La suppression a échoué" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Assemblée générale inconnue" },
      { status: 404 },
    );
  }

  if (data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.assemblies);
  }
  return new NextResponse(null, { status: 204 });
}
