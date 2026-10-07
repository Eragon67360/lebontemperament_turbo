import { expect, test } from "@playwright/test";

// P1 — sidebar orientation. Guards the longest-prefix matching in
// apps/admin/lib/navigation.ts: a nested route must light up the nav entry it
// belongs to (exact-href matching highlights nothing on these deeper routes),
// listed under its section's title.
test("a nested route marks its closest sidebar entry as current", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard/public/concerts/prochains-concerts");

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(nav.locator("[aria-current='page']")).toHaveText(
    "Concerts et tournées",
  );
  await expect(
    nav
      .getByRole("list", { name: "Concerts et site public", exact: true })
      .locator("[aria-current='page']"),
  ).toHaveText("Concerts et tournées");
});

// P1 — « Vous êtes ici » is worded like the sidebar, section first.
test("the header trail names the section and the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard/admin/anniversary/hero");

  const trail = page.getByRole("navigation", { name: "Vous êtes ici" });
  await expect(trail).toContainText("Campagne 40 ans");
  await expect(trail).toContainText("Contenu");
  await expect(trail.locator("[aria-current='page']")).toHaveText(
    "En-tête de la page",
  );
});

// P1 — every sidebar entry must lead somewhere. The travail and hub pages used
// to link routes that had been moved or never built (/dashboard/travail/...,
// /dashboard/members/users), which only showed up as a 404 after a click.
test("no sidebar entry leads to a missing page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard");

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  const hrefs = new Set<string>();
  const collect = async () => {
    for (const href of await nav
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
      if (href?.startsWith("/dashboard")) hrefs.add(href);
    }
  };

  // The menu is flat: every link is there at once. The campaign's pages are
  // in its own menu, above each of them.
  await collect();
  await page.goto("/dashboard/admin/anniversary");
  for (const href of await page
    .getByRole("navigation", { name: "Pages de la campagne" })
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    if (href?.startsWith("/dashboard")) hrefs.add(href);
  }
  expect(hrefs.size).toBeGreaterThan(15);

  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} should not be missing`).toBeLessThan(
      400,
    );
  }
});

// P1 — on a phone the sidebar is a drawer that closes once a page is chosen.
test("the mobile drawer opens the navigation and closes on navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "Navigation principale" });
  await expect(drawer).toBeVisible();

  await drawer.getByRole("link", { name: "Membres", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard\/admin\/users$/);
  await expect(drawer).toBeHidden();
});
