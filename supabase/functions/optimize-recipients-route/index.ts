import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OSRM_BASE = "https://router.project-osrm.org";

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

type RecipientWithCoords = {
  id: string;
  latitude: number;
  longitude: number;
  sort_order: number;
};

function nearestNeighborOrder(
  withCoords: RecipientWithCoords[],
  start: { lat: number; lng: number },
): RecipientWithCoords[] {
  const ordered: RecipientWithCoords[] = [];
  const remaining = [...withCoords];
  let current = start;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = haversineDistance(
      current.lat,
      current.lng,
      remaining[0].latitude,
      remaining[0].longitude,
    );

    for (let i = 1; i < remaining.length; i++) {
      const d = haversineDistance(
        current.lat,
        current.lng,
        remaining[i].latitude,
        remaining[i].longitude,
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    current = { lat: next.latitude, lng: next.longitude };
  }

  return ordered;
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
    ) as RecipientWithCoords[];

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

    const hasDriver = startLat != null && startLng != null;

    // Build coordinates: OSRM uses lng,lat
    const coordsList: { lng: number; lat: number }[] = hasDriver
      ? [
          { lng: startLng!, lat: startLat! },
          ...withCoords.map((r) => ({ lng: r.longitude, lat: r.latitude })),
        ]
      : withCoords.map((r) => ({ lng: r.longitude, lat: r.latitude }));

    const coordsStr = coordsList.map((c) => `${c.lng},${c.lat}`).join(";");
    const recipientStartIndex = hasDriver ? 1 : 0;

    let ordered: RecipientWithCoords[];
    let optimizationMethod: "osrm" | "nearest_neighbor" = "nearest_neighbor";

    try {
      const params = new URLSearchParams({
        roundtrip: "false",
        source: hasDriver ? "first" : "any",
        destination: hasDriver ? "last" : "any",
      });
      const osrmUrl = `${OSRM_BASE}/trip/v1/driving/${coordsStr}?${params}`;
      const osrmRes = await fetch(osrmUrl);

      if (!osrmRes.ok) {
        throw new Error(`OSRM returned ${osrmRes.status}`);
      }

      const osrmJson = await osrmRes.json();
      if (osrmJson.code !== "Ok") {
        throw new Error(osrmJson.message || "OSRM request failed");
      }

      const waypoints = osrmJson.waypoints as Array<{
        waypoint_index: number;
        location: [number, number];
      }>;

      if (!waypoints || waypoints.length === 0) {
        throw new Error("No waypoints in OSRM response");
      }

      // waypoints are in input order; waypoint_index = position in optimized trip
      // Sort by waypoint_index to get visit order, then map to recipients
      const sortedByTripOrder = [...waypoints].sort(
        (a, b) => a.waypoint_index - b.waypoint_index,
      );

      // Map input indices to recipients (skip driver at index 0 when present)
      ordered = sortedByTripOrder
        .map((w) =>
          waypoints.findIndex((wp) => wp.waypoint_index === w.waypoint_index),
        )
        .filter((idx) => idx >= recipientStartIndex)
        .map((idx) => withCoords[idx - recipientStartIndex]);
      optimizationMethod = "osrm";
    } catch (osrmErr) {
      console.warn(
        "OSRM Trip failed, falling back to nearest-neighbor:",
        osrmErr,
      );
      const start = hasDriver
        ? { lat: startLat!, lng: startLng! }
        : {
            lat: withCoords[0].latitude,
            lng: withCoords[0].longitude,
          };
      ordered = nearestNeighborOrder(withCoords, start);
    }

    // Build final order: optimized first, then those without coords
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
        optimizationMethod,
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
