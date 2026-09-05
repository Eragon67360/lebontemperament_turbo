import { expect, test } from "@playwright/test";

// P2 — authenticated member area on the public website, read-only.
// Session saved by global-setup (.auth/website.json).
const MEMBER_PAGES = [
  "/membres",
  "/membres/calendrier",
  "/membres/concerts",
  "/membres/travail",
  "/membres/administration",
];

for (const path of MEMBER_PAGES) {
  test(`${path} loads for a logged-in member`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    // Auth gate: must not bounce back to the login page.
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("main")).toBeVisible();
  });
}

// Guard check: logged-out visitors must be redirected away.
test.describe("unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/membres redirects to login", async ({ page }) => {
    await page.goto("/membres");
    await page.waitForURL(/\/auth\/login/);
  });
});
