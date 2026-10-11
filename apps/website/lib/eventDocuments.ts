import type { Database } from "@repo/domain/database.types";
import type {
  Event,
  EventDocumentLink,
  EventWithDocuments,
} from "@repo/domain/types/events";
import {
  EVENT_DOCUMENT_COLUMNS,
  eventDocumentLinks,
} from "@repo/domain/utils/eventDocuments";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Files attached to events (public.event_documents, managed in the admin):
 * the « bulletin de réservation » of a sale, a stay's programme… Row-level
 * security decides who reads them (anyone for a public event, members for
 * the others). Until the table exists (its migration is applied by hand),
 * or when it can't be read, events simply have no files.
 */
export async function withEventDocuments<T extends Event>(
  supabase: SupabaseClient<Database>,
  events: T[],
): Promise<Array<T & { documents: EventDocumentLink[] }>> {
  const byEvent = new Map<string, EventDocumentLink[]>();
  if (events.length > 0) {
    const { data, error } = await supabase
      .from("event_documents")
      .select(EVENT_DOCUMENT_COLUMNS)
      .in(
        "event_id",
        events.map((event) => event.id),
      );
    if (error) {
      console.warn(
        "[eventDocuments] events shown without files:",
        error.message,
      );
    } else {
      const rows = new Map<string, typeof data>();
      for (const row of data) {
        rows.set(row.event_id, [...(rows.get(row.event_id) ?? []), row]);
      }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      for (const [eventId, list] of rows) {
        byEvent.set(eventId, eventDocumentLinks(supabaseUrl, list));
      }
    }
  }
  return events.map((event) => ({
    ...event,
    documents: byEvent.get(event.id) ?? [],
  }));
}

export type { EventWithDocuments };
