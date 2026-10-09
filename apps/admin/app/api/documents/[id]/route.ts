import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  DOCUMENT_COLUMNS,
  documentPatchSchema,
} from "@/utils/documents/schemas";
import { checkUploadedPdf, DOCUMENTS_BUCKET } from "@/utils/documents/storage";
import { createClient } from "@/utils/supabase/server";
import type { TablesUpdate } from "@repo/domain/database.types";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const idSchema = z.guid();

/**
 * PATCH: edit, archive (`status: "archived"`), put back online, or replace
 * the file (`storage_key` of a new upload; the old file is kept so the
 * history can restore it).
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const id = idSchema.safeParse((await params).id);
  if (!id.success) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }

  const parsed = parsePatchBody(documentPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { storage_key, status, ...fields } = parsed.data;

  const supabase = await createClient();
  const update: TablesUpdate<"site_documents"> = {
    ...fields,
    updated_by: auth.user.id,
  };
  if (status) {
    update.status = status;
    update.archived_at =
      status === "archived" ? new Date().toISOString() : null;
  }
  if (storage_key) {
    const check = await checkUploadedPdf(supabase, storage_key);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    update.storage_key = storage_key;
    update.size_bytes = check.sizeBytes;
  }

  const { data, error } = await supabase
    .from("site_documents")
    .update(update)
    .eq("id", id.data)
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Le document n'a pas pu être modifié" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }
  return NextResponse.json(data);
}

/** Deletes for good, row and file: superadmins only (admins archive). */
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
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_documents")
    .delete()
    .eq("id", id.data)
    .select("storage_key")
    .maybeSingle();

  if (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Le document n'a pas pu être supprimé" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }

  // Files uploaded from the admin only; the #344 media files stay.
  if (data.storage_key.startsWith("documents/")) {
    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([data.storage_key]);
    if (storageError) {
      console.error("Document deleted, file kept:", storageError);
    }
  }

  return NextResponse.json({ success: true });
}
