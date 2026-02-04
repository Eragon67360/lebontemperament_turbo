import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json();
    const { deliveryId, startLat, startLng } = body as {
      deliveryId: string;
      startLat?: number;
      startLng?: number;
    };

    if (!deliveryId) {
      return new Response(JSON.stringify({ error: "Missing deliveryId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: recipients, error } = await supabaseAdmin
      .from("delivery_recipients")
      .select("id, latitude, longitude, sort_order")
      .eq("delivery_id", deliveryId)
      .order("sort_order");

    if (error) throw error;
    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ message: "No recipients found." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const withCoords = recipients.filter(
      (r) =>
        r.latitude != null &&
        r.longitude != null &&
        typeof r.latitude === "number" &&
        typeof r.longitude === "number",
    );

    const withoutCoords = recipients.filter(
      (r) => r.latitude == null || r.longitude == null,
    );

    if (withCoords.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Aucun destinataire n'a d'adresse avec coordonnées. Ajoutez des adresses pour optimiser l'itinéraire.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Nearest-neighbor from start point (driver position or first recipient)
    const start =
      startLat != null && startLng != null
        ? { lat: startLat, lng: startLng }
        : {
            lat: withCoords[0].latitude as number,
            lng: withCoords[0].longitude as number,
          };

    const ordered: typeof withCoords = [];
    const remaining = [...withCoords];

    let current = start;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = haversineDistance(
        current.lat,
        current.lng,
        remaining[0].latitude as number,
        remaining[0].longitude as number,
      );

      for (let i = 1; i < remaining.length; i++) {
        const d = haversineDistance(
          current.lat,
          current.lng,
          remaining[i].latitude as number,
          remaining[i].longitude as number,
        );
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }

      const next = remaining.splice(nearestIdx, 1)[0];
      ordered.push(next);
      current = {
        lat: next.latitude as number,
        lng: next.longitude as number,
      };
    }

    // Build final order: optimized first, then those without coords (keep their relative order)
    const orderedIds = ordered.map((r) => r.id);
    const withoutCoordsIds = withoutCoords.map((r) => r.id);
    const finalOrder = [...orderedIds, ...withoutCoordsIds];

    for (let i = 0; i < finalOrder.length; i++) {
      await supabaseAdmin
        .from("delivery_recipients")
        .update({ sort_order: i })
        .eq("id", finalOrder[i])
        .eq("delivery_id", deliveryId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimizedCount: ordered.length,
        totalCount: finalOrder.length,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error in optimize-recipients-route:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
