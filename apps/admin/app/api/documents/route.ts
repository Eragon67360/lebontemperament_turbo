import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  COLLECTION_COLUMNS,
  DOCUMENT_COLUMNS,
  documentCreateSchema,
} from "@/utils/documents/schemas";
import { checkUploadedPdf } from "@/utils/documents/storage";
import { createClient } from "@/utils/supabase/server";
import { uniqueFileName } from "@repo/domain/utils/documents";
import { NextResponse } from "next/server";

/**
 * « Documents de l'association » (public.site_documents).
 * GET: every collection and every document, archived ones included, and
 * whether the caller may delete for good (superadmins).
 * POST: a document whose PDF the browser has just uploaded to site-media.
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const [collections, documents] = await Promise.all([
    supabase
      .from("document_collections")
      .select(COLLECTION_COLUMNS)
      .order("sort_order", { ascending: true }),
    supabase.from("site_documents").select(DOCUMENT_COLUMNS),
  ]);

  const error = collections.error ?? documents.error;
  if (error) {
    // 42P01 / PGRST205: the migration isn't applied on this database yet.
    const missing = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        error: missing
          ? "Les documents ne sont pas encore installés sur cette base."
          : "Erreur serveur",
        notInstalled: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  return NextResponse.json({
    collections: collections.data,
    documents: documents.data,
    canDelete: auth.role === "superadmin",
  });
}

export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(documentCreateSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  const supabase = await createClient();
  const check = await checkUploadedPdf(supabase, body.storage_key);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  // The file name is the document's address: unique in its collection.
  const { data: siblings, error: siblingsError } = await supabase
    .from("site_documents")
    .select("file_name")
    .eq("collection_id", body.collection_id);
  if (siblingsError) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("site_documents")
    .insert({
      ...body,
      file_name: uniqueFileName(
        body.file_name,
        siblings.map((s) => s.file_name),
      ),
      size_bytes: check.sizeBytes,
      created_by: auth.user.id,
      updated_by: auth.user.id,
    })
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Le document n'a pas pu être enregistré" },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
