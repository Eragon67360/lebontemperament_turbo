import { expect, test } from "@playwright/test";

// P0 — authenticated read views: each dashboard section loads without
// redirecting to login and renders content. Read-only against the DB.
const DASHBOARD_VIEWS = [
  "/dashboard",
  "/dashboard/public/concerts",
  "/dashboard/public/concerts/prochains-concerts",
  "/dashboard/public/concerts/projets",
  "/dashboard/public/gallery",
  "/dashboard/public/gallery/videos",
  "/dashboard/members",
  "/dashboard/members/repetitions",
  "/dashboard/members/evenements",
  "/dashboard/members/travail",
];

for (const path of DASHBOARD_VIEWS) {
  test(`${path} loads`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(new RegExp(path));
    await expect(page.locator("main")).toBeVisible();
  });
}
