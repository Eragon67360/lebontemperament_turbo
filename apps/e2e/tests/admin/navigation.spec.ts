import { expect, test } from "@playwright/test";

// P1 — sidebar orientation. Guards the longest-prefix matching in
// apps/admin/lib/navigation.ts: a nested route must light up the nav entry it
// belongs to (exact-href matching highlights nothing on these deeper routes).
test("a nested route marks its closest sidebar entry as current", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard/public/concerts/prochains-concerts");

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(nav.locator("[aria-current='page']")).toHaveText(
    "Prochains concerts",
  );
});

// P1 — every sidebar entry must lead somewhere. The travail and hub pages used
// to link routes that had been moved or never built (/dashboard/travail/...,
// /dashboard/members/users), which only showed up as a 404 after a click.
test("no sidebar entry leads to a missing page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard");

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  // Expand the collapsed campaign section so its entries are checked too.
  for (const trigger of await nav.getByRole("button").all()) {
    if ((await trigger.getAttribute("data-state")) === "closed") {
      await trigger.click();
    }
  }

  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => !!href?.startsWith("/dashboard")),
    );
  expect(hrefs.length).toBeGreaterThan(5);

  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} should not be missing`).toBeLessThan(
      400,
    );
  }
});
