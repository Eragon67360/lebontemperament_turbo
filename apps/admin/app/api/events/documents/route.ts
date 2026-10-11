import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import {
  checkUploadedEventFile,
  EVENT_DOCUMENT_ADMIN_COLUMNS,
  eventDocumentCreateSchema,
  eventDocumentDeleteSchema,
  eventDocumentPatchSchema,
  removeEventFiles,
} from "@/utils/events/documents";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Files attached to events (public.event_documents).
 * GET: every event's files.
 * POST: a file the browser has just uploaded to site-media.
 * PATCH: a new label. DELETE: the row and its file.
 */
export async function GET() {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_documents")
    .select(EVENT_DOCUMENT_ADMIN_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // 42P01 / PGRST205: the migration isn't applied on this database yet.
    const missing = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        error: missing
          ? "Les documents d'événement ne sont pas encore installés sur cette base."
          : "Erreur serveur",
        notInstalled: missing,
      },
      { status: missing ? 503 : 500 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(
    eventDocumentCreateSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  const supabase = await createClient();
  const check = await checkUploadedEventFile(
    supabase,
    body.storage_key,
    body.mime_type,
  );
  if (!check.ok) {
    await removeEventFiles(supabase, [body.storage_key]);
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  // New files go after the event's existing ones.
  const { data: siblings, error: siblingsError } = await supabase
    .from("event_documents")
    .select("sort_order")
    .eq("event_id", body.event_id);
  if (siblingsError) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("event_documents")
    .insert({
      ...body,
      size_bytes: check.sizeBytes,
      sort_order: Math.max(-1, ...siblings.map((s) => s.sort_order)) + 1,
      created_by: auth.user.id,
    })
    .select(EVENT_DOCUMENT_ADMIN_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating event document:", error);
    // 23503: the event was deleted meanwhile.
    return NextResponse.json(
      {
        error:
          error.code === "23503"
            ? "L'événement n'existe plus"
            : "Le document n'a pas pu être enregistré",
      },
      { status: error.code === "23503" ? 404 : 500 },
    );
  }

  revalidateWebsiteAfterResponse(REVALIDATE.agenda);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(
    eventDocumentPatchSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { id, label } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_documents")
    .update({ label })
    .eq("id", id)
    .select(EVENT_DOCUMENT_ADMIN_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Error renaming event document:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Document introuvable" },
      { status: 404 },
    );
  }

  revalidateWebsiteAfterResponse(REVALIDATE.agenda);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = parsePatchBody(
    eventDocumentDeleteSchema,
    await readJson(request),
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_documents")
    .delete()
    .eq("id", parsed.data.id)
    .select("storage_key")
    .maybeSingle();

  if (error) {
    console.error("Error deleting event document:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Document introuvable" },
      { status: 404 },
    );
  }

  await removeEventFiles(supabase, [data.storage_key]);
  revalidateWebsiteAfterResponse(REVALIDATE.agenda);
  return NextResponse.json({ ok: true });
}
