import { EVENT_COLUMNS } from "@/lib/columns";
import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { databaseErrorResponse } from "@/utils/databaseErrors";
import { removeEventFiles } from "@/utils/events/documents";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import {
  eventCreateSchema,
  eventDeleteSchema,
  eventPatchSchema,
} from "@/utils/season/apiSchemas";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("date_from", { ascending: true });

  if (error) {
    return databaseErrorResponse(
      error,
      "Les événements n'ont pas pu être chargés",
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  // Vérifier l'autorisation
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  // Only the columns the event dialog sends, each value checked.
  const parsed = parsePatchBody(eventCreateSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("events").insert([parsed.data]);

    if (error) throw error;

    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    return NextResponse.json({ message: "Événement créé avec succès" });
  } catch (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la création de l'événement",
    );
  }
}

export async function PATCH(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  // The event's id and the dialog's columns: unknown keys are refused.
  const parsed = parsePatchBody(eventPatchSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { id, ...updateData } = parsed.data;

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    return NextResponse.json({ message: "Événement mis à jour avec succès" });
  } catch (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la mise à jour de l'événement",
    );
  }
}

export async function DELETE(request: Request) {
  // Vérifier l'autorisation
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const parsed = parsePatchBody(eventDeleteSchema, await readJson(request));
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }
  const { id } = parsed.data;

  try {
    const supabase = await createClient();

    // The event's files go with it (the rows cascade, the objects don't).
    // Before the event_documents migration the read fails: nothing to remove.
    const { data: files } = await supabase
      .from("event_documents")
      .select("storage_key")
      .eq("event_id", id);

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) throw error;

    await removeEventFiles(
      supabase,
      (files ?? []).map((file) => file.storage_key),
    );

    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    return NextResponse.json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    return databaseErrorResponse(
      error,
      "Erreur lors de la suppression de l'événement",
    );
  }
}
