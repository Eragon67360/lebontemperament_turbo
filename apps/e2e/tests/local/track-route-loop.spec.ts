import { expect, test, type Page } from "@playwright/test";

/**
 * `/track` asks the routing service for a route only when the driver has
 * really moved, and keeps following the driver (audit PERF-001, #741).
 *
 * The real page runs in the browser: React, `next/dynamic`, mapbox-gl with
 * an empty style served from this file. Every other call (the tracking RPC,
 * the routing service, Mapbox) is answered or refused here, so nothing
 * reaches Supabase, OSRM or Mapbox and no credentials are needed. The clock
 * is Playwright's: the 10 s poll and the 30 s route refresh are advanced by
 * hand. Before the fix the first test counted dozens of route requests.
 */

type Point = { lng: number; lat: number };

const START: Point = { lng: 7.75, lat: 48.58 };
const HOME: Point = { lng: 7.76, lat: 48.6 };

/** About `metres` further north of `point` (1° of latitude is 111.32 km). */
const north = (point: Point, metres: number): Point => ({
  lng: point.lng,
  lat: point.lat + metres / 111_320,
});

/** What the tracking RPC answers for a round on its way to this recipient. */
function trackingAnswer(position: Point) {
  const now = Date.now();
  return {
    delivery: {
      id: "d1",
      public_token: "e2e",
      latitude: position.lat,
      longitude: position.lng,
      is_tracking_active: true,
      expires_at: new Date(now + 86_400_000).toISOString(),
      updated_at: new Date(now).toISOString(),
      scheduled_at: null,
      scheduled_end_at: null,
      is_delayed: false,
      delay_minutes: null,
      problem_message: null,
      current_recipient_id: "r1",
    },
    recipient: {
      id: "r1",
      delivery_id: "d1",
      label: "Fromages",
      delivered_at: null,
      latitude: HOME.lat,
      longitude: HOME.lng,
      scheduled_at: null,
    },
  };
}

interface World {
  /** Where the driver is; the next poll reports it. */
  position: Point;
  rpcCalls: number;
  routeRequests: number;
  routeLatencyMs: number;
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "*",
};

/** The page's own files come from the dev server; everything else from here. */
async function stubNetwork(page: Page, baseURL: string, world: World) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();
    if (url.startsWith(baseURL)) return route.continue();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS });
    }
    if (url.includes("/rest/v1/rpc/get_tracking_by_recipient_token")) {
      world.rpcCalls += 1;
      return route.fulfill({
        json: trackingAnswer(world.position),
        headers: CORS,
      });
    }
    if (url.startsWith("https://router.project-osrm.org/")) {
      world.routeRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, world.routeLatencyMs));
      return route.fulfill({
        json: {
          code: "Ok",
          routes: [
            {
              duration: 420,
              geometry: {
                type: "LineString",
                coordinates: [
                  [world.position.lng, world.position.lat],
                  [HOME.lng, HOME.lat],
                ],
              },
            },
          ],
        },
        headers: CORS,
      });
    }
    if (/^https:\/\/api\.mapbox\.com\/styles\/v1\//.test(url)) {
      return route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
    }
    // Mapbox telemetry, and anything unexpected.
    return route.abort();
  });
}

/** Opens the page on a live round and waits for the first route. */
async function openLiveRound(page: Page, baseURL: string, world: World) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await stubNetwork(page, baseURL, world);
  await page.goto("/track?token=e2e-token");
  // The first visit compiles the page.
  await expect(page.getByText("Arrivée prévue")).toBeVisible({
    timeout: 120_000,
  });
  await expect.poll(() => world.routeRequests, { timeout: 60_000 }).toBe(1);
  // 420 s of route: the answer reached the panel.
  await expect(page.getByText("dans environ 7 minutes")).toBeVisible();
  return errors;
}

const recenterButton = (page: Page) =>
  page.getByRole("button", { name: "Recentrer sur ma position" });

test("asks for one route while the driver stands still, and keeps following", async ({
  page,
  baseURL,
}) => {
  const world: World = {
    position: START,
    rpcCalls: 0,
    routeRequests: 0,
    routeLatencyMs: 50,
  };
  await page.clock.install();
  const errors = await openLiveRound(page, baseURL!, world);

  // Before the fix, every answer re-rendered the page, which asked again as
  // fast as the routing service answered: real seconds, not the clock's.
  await page.waitForTimeout(3_000);
  expect(world.routeRequests, "route requests while standing still").toBe(1);
  // The map still follows the driver: no gesture was made.
  await expect(recenterButton(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("asks again after a move of 50 m or after 30 s, not at every poll", async ({
  page,
  baseURL,
}) => {
  const world: World = {
    position: START,
    rpcCalls: 0,
    routeRequests: 0,
    routeLatencyMs: 50,
  };
  await page.clock.install();
  await openLiveRound(page, baseURL!, world);
  // From here, time moves only when told to. The margin covers a slow round
  // trip on a busy machine; the jump fires at most one poll, which reports
  // the same position.
  const pageNow = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(pageNow + 5_000);

  /** The driver moves on, and the next poll (10 s) reports it. */
  const poll = async (metres: number) => {
    const before = world.rpcCalls;
    world.position = north(world.position, metres);
    await page.clock.runFor(10_000);
    await expect.poll(() => world.rpcCalls).toBeGreaterThan(before);
    // The answer reaches the map (the clock is paused, so the route request
    // it may trigger is stamped with the time `runFor` reached).
    await page.waitForTimeout(1_500);
  };

  // A real move: a route, requested at a time the clock now controls.
  await poll(100);
  await expect.poll(() => world.routeRequests).toBe(2);
  // 20 m, then 40 m from that route: not a real move.
  await poll(20);
  expect(world.routeRequests).toBe(2);
  await poll(20);
  expect(world.routeRequests).toBe(2);
  // 45 m, but the last route is now 30 s old.
  await poll(5);
  await expect.poll(() => world.routeRequests).toBe(3);
  // Not a real move, and the last route is recent.
  await poll(2);
  expect(world.routeRequests).toBe(3);
  // Another real move.
  await poll(100);
  await expect.poll(() => world.routeRequests).toBe(4);
  // The map followed each position without taking its own moves for a gesture.
  await expect(recenterButton(page)).toHaveCount(0);
});

test("a drag stops the following and « Recentrer » restores it", async ({
  page,
  baseURL,
}) => {
  const world: World = {
    position: START,
    rpcCalls: 0,
    routeRequests: 0,
    routeLatencyMs: 50,
  };
  await openLiveRound(page, baseURL!, world);
  await expect(recenterButton(page)).toHaveCount(0);

  const box = await page.locator("canvas.mapboxgl-canvas").boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height * 0.7;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 120, y - 60, { steps: 8 });
  await page.mouse.up();

  await expect(recenterButton(page)).toBeVisible();
  await recenterButton(page).click();
  await expect(recenterButton(page)).toHaveCount(0);
});
