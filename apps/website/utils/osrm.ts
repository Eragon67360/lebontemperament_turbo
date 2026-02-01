/**
 * OSRM public demo server - no API key required.
 * Returns route geometry as GeoJSON LineString coordinates [lng, lat][].
 */
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface OSRMRouteResult {
  coordinates: [number, number][];
  /** Route duration in seconds (for ETA: now + durationSeconds). */
  durationSeconds: number | null;
}

/**
 * Fetches a driving route between two points from OSRM.
 * @param from [lng, lat] or [lat, lng] - OSRM uses lng,lat
 * @param to [lng, lat] or [lat, lng]
 * @returns Route geometry and duration in seconds, or null on error
 */
export async function fetchOSRMRoute(
  from: [number, number],
  to: [number, number],
): Promise<OSRMRouteResult | null> {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const coords = `${lng1},${lat1};${lng2},${lat2}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        duration?: number;
        geometry?: { coordinates?: [number, number][] };
      }>;
    };
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route?.geometry?.coordinates) {
      return null;
    }
    const durationSeconds =
      typeof route.duration === "number" ? route.duration : null;
    return {
      coordinates: route.geometry.coordinates,
      durationSeconds,
    };
  } catch {
    return null;
  }
}
