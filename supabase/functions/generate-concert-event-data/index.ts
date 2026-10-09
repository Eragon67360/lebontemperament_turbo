// Fills a concert's event data for Google (venue, address, free or price)
// with AI, from what the admin typed and from the poster (#328).
//
// Body: `{ "concert_id": "<uuid>", "dry_run"?: boolean }`.
// - Without dry_run, the result is written through
//   `concert_event_data_write`, which doesn't notify members.
// - With dry_run, it is only returned: nothing is written.
//
// Callers: the admin's concert routes (POST/PATCH /api/prochains-concerts),
// which forward the signed-in admin's session once the concert is saved, and
// internal calls with `x-internal-secret`. The OpenAI key is the project's
// existing function secret OPENAI_API_KEY (shared with the rehearsal sync).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { requireInternalSecretOrAdmin } from "../_shared/caller-auth.ts";
import { extractEventData, type ConcertInput } from "./extract.ts";
import { findServiceKey } from "../_shared/supabase-keys.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      source: "generate-concert-event-data",
      event,
      ...data,
    }),
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = findServiceKey();
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !serviceKey || !openAiKey) {
    log("config_missing");
    return jsonResponse(
      { error: "Function not configured", error_code: "config" },
      500,
    );
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const caller = await requireInternalSecretOrAdmin(req, supabase);
  if (caller instanceof Response) return caller;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const concertId = body.concert_id;
  const dryRun = body.dry_run === true;
  if (typeof concertId !== "string" || !UUID.test(concertId)) {
    return jsonResponse({ error: "concert_id must be a uuid" }, 400);
  }

  const { data: concert, error: readError } = await supabase
    .from("concerts")
    .select(
      "id, name, place, date, time, additional_informations, related_link, affiche, tours(name)",
    )
    .eq("id", concertId)
    .maybeSingle();
  if (readError) {
    log("read_failed", { concert_id: concertId, message: readError.message });
    return jsonResponse(
      { error: "Could not read the concert", error_code: "database" },
      500,
    );
  }
  if (!concert) {
    return jsonResponse({ error: "Concert not found" }, 404);
  }

  const tour = concert.tours as { name?: string } | null;
  const input: ConcertInput = {
    name: concert.name,
    place: concert.place,
    date: concert.date,
    time: concert.time,
    additional_informations: concert.additional_informations,
    related_link: concert.related_link,
    affiche: concert.affiche,
    tour_name: tour?.name ?? null,
  };

  let result: Awaited<ReturnType<typeof extractEventData>>;
  try {
    result = await extractEventData(openAiKey, input, {
      model: Deno.env.get("CONCERT_EVENT_MODEL") || undefined,
    });
  } catch (error) {
    log("llm_failed", {
      concert_id: concertId,
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      { error: "The AI request failed", error_code: "llm" },
      502,
    );
  }

  log("extracted", {
    concert_id: concertId,
    caller: caller.kind,
    dry_run: dryRun,
    used_poster: result.usedPoster,
    data: result.data,
  });

  if (!dryRun) {
    const { data: written, error: writeError } = await supabase.rpc(
      "concert_event_data_write",
      {
        p_id: concertId,
        p_venue_name: result.data.venue_name,
        p_street_address: result.data.street_address,
        p_postal_code: result.data.postal_code,
        p_city: result.data.city,
        p_country: result.data.country,
        p_is_free: result.data.is_free,
        p_price: result.data.price,
      },
    );
    if (writeError || written !== true) {
      log("write_failed", {
        concert_id: concertId,
        message: writeError?.message ?? "concert not found",
      });
      return jsonResponse(
        { error: "Could not save the event data", error_code: "database" },
        500,
      );
    }
  }

  return jsonResponse({
    ok: true,
    concert_id: concertId,
    dry_run: dryRun,
    used_poster: result.usedPoster,
    event_data: result.data,
  });
});
