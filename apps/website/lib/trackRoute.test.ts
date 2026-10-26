// Run with: npx tsx lib/trackRoute.test.ts
import assert from "node:assert/strict";
import { mock } from "node:test";
import {
  distanceMeters,
  ROUTE_REFRESH_DISTANCE_M,
  ROUTE_REFRESH_INTERVAL_MS,
  shouldRequestRoute,
  type LngLat,
  type RouteRequest,
} from "./trackRoute";

// --- distanceMeters: 1° of latitude is about 111 km, 1° of longitude about
// 73 km at 48.6° N (Strasbourg).
const HOME: LngLat = [7.76, 48.6];
assert.equal(distanceMeters(HOME, HOME), 0);
assert.ok(Math.abs(distanceMeters(HOME, [7.76, 48.601]) - 111.2) < 1);
assert.ok(Math.abs(distanceMeters(HOME, [7.761, 48.6]) - 73.5) < 1);
assert.ok(Math.abs(distanceMeters([0, 0], [0, 90]) - 10_007_543) < 1000);

/** About `metres` further north of `from`. */
const north = (from: LngLat, metres: number): LngLat => [
  from[0],
  from[1] + metres / 111_320,
];

// --- shouldRequestRoute: the first request, a new destination, a real move,
// or an old request; never a small move soon after a request.
const START: LngLat = [7.75, 48.58];
const t0 = 1_700_000_000_000;
const last: RouteRequest = { from: START, to: HOME, at: t0 };

assert.equal(shouldRequestRoute(null, START, HOME, t0), true, "first request");
assert.equal(shouldRequestRoute(last, START, HOME, t0), false, "same place");
assert.equal(
  shouldRequestRoute(last, START, HOME, t0 + 15_000),
  false,
  "same place 15 s later",
);
assert.equal(
  shouldRequestRoute(last, north(START, 20), HOME, t0 + 10_000),
  false,
  "20 m is not a real move",
);
assert.equal(
  shouldRequestRoute(
    last,
    north(START, ROUTE_REFRESH_DISTANCE_M + 1),
    HOME,
    t0 + 1,
  ),
  true,
  "a real move",
);
assert.equal(
  shouldRequestRoute(last, START, HOME, t0 + ROUTE_REFRESH_INTERVAL_MS),
  true,
  "the last request is old",
);
assert.equal(
  shouldRequestRoute(last, START, [7.77, 48.61], t0),
  true,
  "another destination",
);

// --- A simulation of the map's effect: each report of the driver's position
// runs the decision; the routing service is a fake fetch that counts calls.
// Fake timers drive the clock the decision reads.
function simulate(
  reports: Array<{ afterMs: number; from: LngLat; to?: LngLat }>,
): number {
  mock.timers.enable({ apis: ["Date"], now: t0 });
  let requests = 0;
  const fetchRoute = async () => {
    requests += 1;
    return { durationSeconds: 420 };
  };
  let lastRequest: RouteRequest | null = null;
  try {
    for (const report of reports) {
      mock.timers.tick(report.afterMs);
      const to = report.to ?? HOME;
      if (shouldRequestRoute(lastRequest, report.from, to, Date.now())) {
        lastRequest = { from: report.from, to, at: Date.now() };
        void fetchRoute();
      }
    }
  } finally {
    mock.timers.reset();
  }
  return requests;
}

// The loop of #741: the same position reported 300 times in 15 s (as fast as
// the routing server answered) asks for one route, not 300.
assert.equal(
  simulate(Array.from({ length: 300 }, () => ({ afterMs: 50, from: START }))),
  1,
  "a standing driver reported every 50 ms for 15 s",
);

// A driver crawling 5 m per 10 s poll for 2 minutes: a route at 0, 30, 60,
// 90 and 120 s (the 30 s rule), not at every poll.
assert.equal(
  simulate(
    Array.from({ length: 13 }, (_, i) => ({
      afterMs: i === 0 ? 0 : 10_000,
      from: north(START, 5 * i),
    })),
  ),
  5,
  "a slow driver polled every 10 s for 2 minutes",
);

// A driver moving 60 m per poll: every poll brings a new route.
assert.equal(
  simulate(
    Array.from({ length: 13 }, (_, i) => ({
      afterMs: i === 0 ? 0 : 10_000,
      from: north(START, 60 * i),
    })),
  ),
  13,
  "a moving driver polled every 10 s for 2 minutes",
);

// A new destination (the next recipient) is routed at once.
assert.equal(
  simulate([
    { afterMs: 0, from: START },
    { afterMs: 1_000, from: START, to: [7.77, 48.61] },
  ]),
  2,
  "the destination changed",
);

console.log("trackRoute: all tests passed");
