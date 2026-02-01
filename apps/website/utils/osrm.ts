/**
 * OSRM public demo server - no API key required.
 * Returns route geometry as GeoJSON LineString coordinates [lng, lat][].
 */
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface OSRMRouteResult {
  coordinates: [number, number][];
}

/**
 * Fetches a driving route between two points from OSRM.
 * @param from [lng, lat] or [lat, lng] - OSRM uses lng,lat
 * @param to [lng, lat] or [lat, lng]
 * @returns Route geometry as array of [lng, lat] for MapLibre/GeoJSON, or null on error
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
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) {
      return null;
    }
    return { coordinates: data.routes[0].geometry.coordinates };
  } catch {
    return null;
  }
}
