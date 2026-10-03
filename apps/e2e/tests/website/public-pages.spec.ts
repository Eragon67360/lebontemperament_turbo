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
// at most one API call (the feature flag and the admin status are rendered
// on the server; the concert-story teaser is server-rendered too, so the one
// allowed call is the featured-videos bubble).
test("the home page opens no websocket and at most one API call", async ({
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
  expect(apiCalls.length, apiCalls.join(", ")).toBeLessThanOrEqual(1);
});
