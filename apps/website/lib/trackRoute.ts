/**
 * When the tracking map (`/track`, `/l/<code>`) asks the routing service
 * for a new route (#741).
 *
 * The driver's position arrives every 10 s. Most polls move the marker by a
 * few metres and the route barely changes, so a route is requested only
 * when the driver has moved at least {@link ROUTE_REFRESH_DISTANCE_M} since
 * the last request, when that request is older than
 * {@link ROUTE_REFRESH_INTERVAL_MS}, or when the destination changed. The
 * public routing server withdraws access from clients that ask too often.
 */

/** How far the driver must have moved before the route is asked again. */
export const ROUTE_REFRESH_DISTANCE_M = 50;

/** How old the last request must be before the route is asked again anyway. */
export const ROUTE_REFRESH_INTERVAL_MS = 30_000;

/** A point as GeoJSON orders it: `[longitude, latitude]`. */
export type LngLat = readonly [number, number];

/** The last route request made: from where, to where, and when (ms since the epoch). */
export interface RouteRequest {
  from: LngLat;
  to: LngLat;
  at: number;
}

const EARTH_RADIUS_M = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two points, in metres (haversine). */
export function distanceMeters(a: LngLat, b: LngLat): number {
  const dLat = toRadians(b[1] - a[1]);
  const dLng = toRadians(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a[1])) *
      Math.cos(toRadians(b[1])) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Whether a new route should be requested now, given the last request made
 * (`null` when none was), the driver's position and the destination.
 */
export function shouldRequestRoute(
  last: RouteRequest | null,
  from: LngLat,
  to: LngLat,
  now: number,
): boolean {
  if (!last) return true;
  if (last.to[0] !== to[0] || last.to[1] !== to[1]) return true;
  if (now - last.at >= ROUTE_REFRESH_INTERVAL_MS) return true;
  return distanceMeters(last.from, from) >= ROUTE_REFRESH_DISTANCE_M;
}
