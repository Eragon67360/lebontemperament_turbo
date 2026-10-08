import { expect, test } from "@playwright/test";

// P0 — authenticated read views: each dashboard page loads without
// redirecting to login and renders content. Read-only against the DB.
// Keep this list aligned with apps/admin/utils/routes.ts: the hub pages
// /dashboard/public/concerts, /dashboard/public/gallery and /dashboard/members
// were removed in #300, so only routes with a page.tsx belong here.
const DASHBOARD_VIEWS = [
  "/dashboard",
  "/dashboard/public/concerts/prochains-concerts",
  "/dashboard/public/concerts/projets",
  "/dashboard/public/gallery/videos",
  "/dashboard/members/repetitions",
  "/dashboard/members/evenements",
  "/dashboard/members/travail",
  "/dashboard/admin/users",
  "/dashboard/admin/users/sync",
  "/dashboard/admin/google-groups",
  "/dashboard/admin/ca",
  "/dashboard/admin/documents",
  "/dashboard/admin/assemblies",
  "/dashboard/public/annonces",
  "/dashboard/public/rejoindre-faq",
  "/dashboard/admin/anniversary",
  "/dashboard/admin/anniversary/hero",
  "/dashboard/admin/anniversary/hero-stats",
  "/dashboard/admin/anniversary/navigation",
  "/dashboard/admin/anniversary/timeline",
  "/dashboard/admin/anniversary/videos",
  "/dashboard/admin/anniversary/audio",
  "/dashboard/admin/anniversary/photos",
  "/dashboard/admin/anniversary/archives",
  "/dashboard/admin/anniversary/form",
  "/dashboard/admin/anniversary/memories",
];

for (const path of DASHBOARD_VIEWS) {
  test(`${path} loads`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(new RegExp(`${path}(\\?|$)`));
    await expect(page.locator("main")).toBeVisible();
  });
}
