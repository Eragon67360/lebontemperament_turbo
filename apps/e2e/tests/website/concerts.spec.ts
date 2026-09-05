import { expect, test } from "@playwright/test";

// P1 — read-only: the concerts page is server-rendered from Supabase
// (projects, concerts, tours, events, rehearsals).
test("concerts page renders the agenda section from Supabase", async ({
  page,
}) => {
  const response = await page.goto("/concerts");
  expect(response?.ok()).toBe(true);
  await expect(page.locator("#agenda")).toBeVisible();
  // CollectionPage JSON-LD is generated from the Supabase query result.
  await expect(
    page.locator('script[type="application/ld+json"]').first(),
  ).toBeAttached();
});
