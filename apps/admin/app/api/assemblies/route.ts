import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import {
  ASSEMBLY_COLUMNS,
  assemblyCreateSchema,
} from "@/utils/assemblies/schemas";
import { checkAuthorization } from "@/utils/auth";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * « Assemblée générale » (public.general_assemblies).
 * GET: every AG, newest first, drafts included, and whether the caller may
 * delete for good (superadmins).
 * POST: a new AG (usually a draft prepared from the previous one).
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("general_assemblies")
    .select(ASSEMBLY_COLUMNS)
    .order("held_at", { ascending: false });

  if (error) {
    // 42P01 / PGRST205: the migration isn't applied on this database yet.
    const missing = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        error: missing
          ? "Les assemblées générales ne sont pas encore installées sur cette base."
          : "Erreur serveur",
        notInstalled: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  return NextResponse.json({
    assemblies: data,
    canDelete: auth.role === "superadmin",
  });
}

export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(assemblyCreateSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("general_assemblies")
    .insert({
      ...parsed.data,
      created_by: auth.user.id,
      updated_by: auth.user.id,
    })
    .select(ASSEMBLY_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating general assembly:", error);
    return NextResponse.json(
      { error: "L'assemblée générale n'a pas pu être enregistrée" },
      { status: 500 },
    );
  }

  if (data.status === "published") {
    revalidateWebsiteAfterResponse(REVALIDATE.assemblies);
  }
  return NextResponse.json(data, { status: 201 });
}
