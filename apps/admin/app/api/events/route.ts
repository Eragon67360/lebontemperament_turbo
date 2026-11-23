import { EVENT_COLUMNS } from "@/lib/columns";
import { parsePatchBody, readJson } from "@/utils/anniversary/patchSchemas";
import { checkAuthorization } from "@/utils/auth";
import { databaseErrorResponse } from "@/utils/databaseErrors";
import { removeEventFiles } from "@/utils/events/documents";
import {
  groupErrorResponse,
  isNotInstalled,
  OWN_DATABASE_MESSAGES,
} from "@/utils/groups/server";
import {
  REVALIDATE,
  revalidateWebsiteAfterResponse,
} from "@/utils/revalidateWebsite";
import {
  eventCreateSchema,
  eventDeleteSchema,
  eventPatchSchema,
} from "@/utils/season/apiSchemas";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Json } from "@repo/domain/database.types";
import { NextResponse } from "next/server";

/** What save_event_with_audience() writes: every column of the dialog. */
const EVENT_WRITE_COLUMNS =
  "title, date_from, date_to, time, location, responsible_name, responsible_email, event_type, description, link, is_public";

/** The groups an event is for, each once, in lower case. */
const groupIds = (ids: readonly string[]) => [
  ...new Set(ids.map((id) => id.toLowerCase())),
];

/**
 * The event and its audience in one transaction (member groups): the push,
 * sent by the database after the commit, then finds the final audience.
 * The function is the service role's only, so it runs with the admin client
 * once the route has checked the admin.
 */
function saveWithAudience(
  event: Record<string, unknown>,
  groups: string[],
  id?: string,
) {
  return createAdminClient().rpc("save_event_with_audience", {
    p_event: event as Json,
    p_group_ids: groups,
    ...(id ? { p_id: id } : {}),
  });
}

/**
 * A failed plain write: the migration's own refusal (« Un événement réservé
 * à des groupes ne peut pas être public ») in its words, anything else as
 * before.
 */
function eventWriteError(
  error: { code?: string; message?: string },
  fallback: string,
) {
  if (OWN_DATABASE_MESSAGES.has(error.message?.trim() ?? "")) {
    return groupErrorResponse(error, fallback);
  }
  return databaseErrorResponse(error, fallback);
}

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const supabase = await createClient();

  const [{ data, error }, audiences] = await Promise.all([
    supabase
      .from("events")
      .select(EVENT_COLUMNS)
      .order("date_from", { ascending: true }),
    supabase.from("event_audiences").select("event_id, group_id"),
  ]);

  if (error) {
    return databaseErrorResponse(
      error,
      "Les événements n'ont pas pu être chargés",
    );
  }
  // Before the member groups migration every event is for every member.
  if (audiences.error && !isNotInstalled(audiences.error)) {
    return databaseErrorResponse(
      audiences.error,
      "Les événements n'ont pas pu être chargés",
    );
  }
  const byEvent = new Map<string, string[]>();
  for (const row of audiences.data ?? []) {
    const list = byEvent.get(row.event_id) ?? [];
    list.push(row.group_id);
    byEvent.set(row.event_id, list);
  }

  return NextResponse.json(
    (data ?? []).map((event) => ({
      ...event,
      audience: byEvent.get(event.id) ?? [],
    })),
  );
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

  const { audience, ...event } = parsed.data;
  const groups = groupIds(audience ?? []);
  const fallback = "Erreur lors de la création de l'événement";

  if (groups.length > 0) {
    const { error } = await saveWithAudience(event, groups);
    if (error) return groupErrorResponse(error, fallback);
    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    return NextResponse.json({ message: "Événement créé avec succès" });
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("events").insert([event]);

    if (error) return eventWriteError(error, fallback);

    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    return NextResponse.json({ message: "Événement créé avec succès" });
  } catch (error) {
    return databaseErrorResponse(error, fallback);
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
  const { id, audience, ...updateData } = parsed.data;
  const fallback = "Erreur lors de la mise à jour de l'événement";
  const updated = () => {
    revalidateWebsiteAfterResponse(REVALIDATE.agenda);
    return NextResponse.json({ message: "Événement mis à jour avec succès" });
  };

  if (audience !== undefined) {
    // The function writes every column: the ones not sent keep their value.
    const admin = createAdminClient();
    const { data: current, error: readError } = await admin
      .from("events")
      .select(EVENT_WRITE_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (readError) return databaseErrorResponse(readError, fallback);
    if (!current) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 },
      );
    }
    const groups = groupIds(audience);
    const { error } = await saveWithAudience(
      { ...current, ...updateData },
      groups,
      id,
    );
    if (!error) return updated();
    // Before the migration an event can only be for every member: the
    // plain update below does the same.
    if (!(isNotInstalled(error) && groups.length === 0)) {
      return groupErrorResponse(error, fallback);
    }
    if (Object.keys(updateData).length === 0) return updated();
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id);

    if (error) return eventWriteError(error, fallback);

    return updated();
  } catch (error) {
    return databaseErrorResponse(error, fallback);
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
