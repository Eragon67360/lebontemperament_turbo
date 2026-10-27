/**
 * OSRM public demo server - no API key required.
 * Returns route geometry as GeoJSON LineString coordinates [lng, lat][].
 */
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/** How long a route request may take before it is given up. */
export const OSRM_TIMEOUT_MS = 8_000;

export interface OSRMRouteResult {
  coordinates: [number, number][];
  /** Route duration in seconds (for ETA: now + durationSeconds). */
  durationSeconds: number | null;
}

export interface FetchOSRMRouteOptions {
  /** Aborts the request, for example when the caller no longer needs it. */
  signal?: AbortSignal;
  /** Overrides {@link OSRM_TIMEOUT_MS}. */
  timeoutMs?: number;
}

/**
 * A signal that aborts when `signal` does or after `timeoutMs`, whichever
 * comes first. Older mobile browsers have no `AbortSignal.any` (Safari
 * before 17.4) or no `AbortSignal.timeout` (Safari before 16): they get the
 * two combined by hand, or the caller's signal alone.
 */
function withTimeout(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal | undefined {
  const timeout =
    typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(timeoutMs)
      : undefined;
  if (!signal) return timeout;
  if (!timeout) return signal;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeout]);
  }
  const controller = new AbortController();
  for (const source of [signal, timeout]) {
    if (source.aborted) {
      controller.abort(source.reason);
      break;
    }
    source.addEventListener("abort", () => controller.abort(source.reason), {
      once: true,
    });
  }
  return controller.signal;
}

/**
 * Fetches a driving route between two points from OSRM.
 * @param from [lng, lat] - OSRM uses lng,lat
 * @param to [lng, lat]
 * @returns Route geometry and duration in seconds, or null on error, on
 * timeout or when `signal` aborted the request
 */
export async function fetchOSRMRoute(
  from: readonly [number, number],
  to: readonly [number, number],
  { signal, timeoutMs = OSRM_TIMEOUT_MS }: FetchOSRMRouteOptions = {},
): Promise<OSRMRouteResult | null> {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const coords = `${lng1},${lat1};${lng2},${lat2}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: withTimeout(signal, timeoutMs) });
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
