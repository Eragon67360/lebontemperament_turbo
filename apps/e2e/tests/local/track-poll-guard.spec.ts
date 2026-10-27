import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * `/track` refreshes the driver's position one request at a time: a tick
 * while an answer is pending is skipped, and an answer that arrives after a
 * newer one is dropped, so an older state never lands over a newer one
 * (audit PERF-011).
 *
 * Runs with `apps/e2e/playwright.local.config.ts` (`npm run test:local -w
 * e2e`): the real page in a browser, every outside call answered here, the
 * 10 s poll driven by Playwright's clock. The tracking RPC can be held back
 * to play a slow connection.
 */

type Point = { lng: number; lat: number };

const START: Point = { lng: 7.75, lat: 48.58 };
const HOME: Point = { lng: 7.76, lat: 48.6 };

// The answers are told apart by the position's timestamp, which the page
// shows under « Position actuelle » (to the second, whatever the time zone).
const FIRST = "2026-10-26T10:00:11Z";
const KEPT_WAITING = "2026-10-26T10:00:22Z";
const NEWER = "2026-10-26T10:00:33Z";

/** What the tracking RPC answers for a round on its way to this recipient. */
function trackingAnswer(updatedAt: string) {
  return {
    delivery: {
      id: "d1",
      public_token: "e2e",
      latitude: START.lat,
      longitude: START.lng,
      is_tracking_active: true,
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      updated_at: updatedAt,
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
  /** The timestamp the next answer carries. */
  answer: string;
  /** When set, the next request is kept waiting instead of answered. */
  holdNext: boolean;
  held: Array<{ route: Route; answer: string }>;
  rpcCalls: number;
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
      if (world.holdNext) {
        world.holdNext = false;
        world.held.push({ route, answer: world.answer });
        return;
      }
      return route.fulfill({
        json: trackingAnswer(world.answer),
        headers: CORS,
      });
    }
    if (url.startsWith("https://router.project-osrm.org/")) {
      // No route: the map and the ETA are not what this spec looks at.
      return route.fulfill({
        json: { code: "NoRoute", routes: [] },
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

/** The « Position actuelle » timestamp ending with these seconds. */
const positionAt = (page: Page, iso: string) =>
  page.getByText(new RegExp(`:${iso.slice(14, 19)}$`));

test("a late answer never lands over a newer one, and ticks don't pile up", async ({
  page,
  baseURL,
}) => {
  const world: World = {
    answer: FIRST,
    holdNext: false,
    held: [],
    rpcCalls: 0,
  };
  await stubNetwork(page, baseURL!, world);
  await page.clock.install();
  await page.goto("/track?token=e2e-token");
  // The first visit compiles the page.
  await expect(positionAt(page, FIRST)).toBeVisible({ timeout: 120_000 });

  // From here, time moves only when told to. The margin covers a slow round
  // trip on a busy machine; the jump fires at most one poll.
  const pageNow = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(pageNow + 5_000);
  await page.waitForTimeout(1_000);
  const rpcBefore = world.rpcCalls;

  // The connection slows down: the next tick's answer is kept waiting.
  world.answer = KEPT_WAITING;
  world.holdNext = true;
  await page.clock.runFor(10_000);
  await expect.poll(() => world.held.length).toBe(1);

  // Three more ticks while it waits: the page asks again once the wait
  // passed 30 s, not at every tick, and shows that answer.
  world.answer = NEWER;
  for (let tick = 0; tick < 3; tick += 1) await page.clock.runFor(10_000);
  await expect(positionAt(page, NEWER)).toBeVisible();

  // The answer kept waiting finally arrives: it is dropped.
  for (const { route, answer } of world.held) {
    await route.fulfill({ json: trackingAnswer(answer), headers: CORS });
  }
  await page.waitForTimeout(1_500);
  await expect(positionAt(page, NEWER)).toBeVisible();
  await expect(positionAt(page, KEPT_WAITING)).toHaveCount(0);
  expect(
    world.rpcCalls - rpcBefore,
    "requests in 40 s on a stalled connection",
  ).toBe(2);
});
