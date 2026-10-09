import { expect, test } from "@playwright/test";

// P0 — read-only smoke: every public page renders with a 200 and a title.
const PUBLIC_PAGES = [
  "/",
  "/concerts",
  "/galerie",
  "/contact",
  "/don",
  "/decouvrir",
  "/rejoindre",
  "/faq",
];

for (const path of PUBLIC_PAGES) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle(/.+/);
  });
}

// P1 — an anonymous visit of the home page costs no Realtime connection and
// only the API calls listed here, each once (the feature flag and the admin
// status are rendered on the server; the concert-story teaser is
// server-rendered too). The featured-videos bubble reads /api/videos; the
// donation card in the navigation reads /api/announcements, which is
// prerendered and served from the CDN.
const HOME_API_CALLS = ["/api/videos", "/api/announcements"];

test("the home page opens no websocket and only the expected API calls", async ({
  page,
}) => {
  const websockets: string[] = [];
  const apiCalls: string[] = [];
  page.on("websocket", (ws) => websockets.push(ws.url()));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) {
      apiCalls.push(new URL(request.url()).pathname);
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { level: 1, name: /Bon Tempérament/ }),
  ).toBeVisible();

  expect(websockets).toEqual([]);
  for (const path of apiCalls) {
    expect(HOME_API_CALLS, apiCalls.join(", ")).toContain(path);
  }
  expect(new Set(apiCalls).size, apiCalls.join(", ")).toBe(apiCalls.length);
});
