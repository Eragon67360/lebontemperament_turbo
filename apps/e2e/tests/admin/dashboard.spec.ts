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
  "/dashboard/public/reglages-du-site",
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

// Only production reads the member roster and the Google Groups (SEC-007):
// anywhere else, staging and previews included, these two pages show their
// title and a notice instead. Assert those, never the lists.
const MEMBER_LIST_VIEWS = [
  {
    path: "/dashboard/admin/users/sync",
    heading: "Synchronisation de la liste des membres",
  },
  { path: "/dashboard/admin/google-groups", heading: "Liste de diffusion" },
];

for (const { path, heading } of MEMBER_LIST_VIEWS) {
  test(`${path} shows its title, and outside production a notice`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    const production =
      !!baseURL && new URL(baseURL).hostname === "admin.lebontemperament.com";
    if (!production) {
      await expect(
        page.getByText("Disponible uniquement en production"),
      ).toBeVisible();
    }
  });
}
