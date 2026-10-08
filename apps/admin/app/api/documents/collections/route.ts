import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  COLLECTION_COLUMNS,
  collectionCreateSchema,
  collectionPatchSchema,
} from "@/utils/documents/schemas";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Collections of « Documents de l'association »: POST adds one (its slug is
 * part of its documents' addresses and never changes), PATCH renames or
 * describes it, DELETE removes an empty one.
 */
export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const parsed = parsePatchBody(
    collectionCreateSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("document_collections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("document_collections")
    .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 10 })
    .select(COLLECTION_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Une collection porte déjà ce nom" },
        { status: 409 },
      );
    }
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const parsed = parsePatchBody(collectionPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { id, ...fields } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_collections")
    .update(fields)
    .eq("id", id)
    .select(COLLECTION_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Collection inconnue" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const parsed = parsePatchBody(
    z.object({ id: z.guid() }).strict(),
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_collections")
    .delete()
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    // 23503: documents still point at it (archived ones count too).
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "Cette collection contient encore des documents (archivés compris)",
        },
        { status: 409 },
      );
    }
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Collection inconnue" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
