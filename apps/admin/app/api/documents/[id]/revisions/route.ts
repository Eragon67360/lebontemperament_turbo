import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { restorableFields } from "@/utils/documents/history";
import { DOCUMENT_COLUMNS, restoreSchema } from "@/utils/documents/schemas";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const idSchema = z.guid();

/** GET: the document's previous versions, newest first (« Historique »). */
export async function GET(_request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = idSchema.safeParse((await params).id);
  if (!id.success) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_revisions")
    .select("id, operation, old_row, changed_by, changed_at")
    .eq("table_name", "site_documents")
    .eq("row_id", id.data)
    .order("changed_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  return NextResponse.json(data);
}

/** POST `{ revision_id }`: puts that version's content back. */
export async function POST(request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = idSchema.safeParse((await params).id);
  if (!id.success) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }
  const parsed = parsePatchBody(restoreSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: revision, error: revisionError } = await supabase
    .from("content_revisions")
    .select("old_row")
    .eq("id", parsed.data.revision_id)
    .eq("table_name", "site_documents")
    .eq("row_id", id.data)
    .maybeSingle();

  if (revisionError) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!revision) {
    return NextResponse.json({ error: "Version inconnue" }, { status: 404 });
  }

  const fields = restorableFields(revision.old_row);
  if (!fields) {
    return NextResponse.json(
      { error: "Cette version ne peut pas être restaurée" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("site_documents")
    .update({ ...fields, updated_by: auth.user.id })
    .eq("id", id.data)
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Error restoring document:", error);
    return NextResponse.json(
      { error: "La version n'a pas pu être restaurée" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }
  return NextResponse.json(data);
}
