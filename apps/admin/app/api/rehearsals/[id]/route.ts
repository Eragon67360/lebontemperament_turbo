import { REHEARSAL_COLUMNS } from "@/lib/columns";
import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { id as idSchema } from "@/utils/apiFields";
import { checkAuthorization } from "@/utils/auth";
import { databaseErrorResponse } from "@/utils/databaseErrors";
import { rehearsalPatchSchema } from "@/utils/season/apiSchemas";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const NOT_FOUND = "Répétition introuvable";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();
    const id = (await params).id;
    const { data, error } = await supabase
      .from("rehearsals")
      .select(REHEARSAL_COLUMNS)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Rehearsal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error fetching rehearsal" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const id = idSchema.safeParse((await params).id);
  if (!id.success) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }
  // Only the form's columns, each value checked; unknown keys are refused.
  const parsed = parsePatchBody(rehearsalPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("rehearsals")
      .update(parsed.data)
      .eq("id", id.data)
      .select(REHEARSAL_COLUMNS)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la modification de la répétition",
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();

    const id = (await params).id;
    const { error } = await supabase.from("rehearsals").delete().eq("id", id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error deleting rehearsal" },
      { status: 500 },
    );
  }
}
