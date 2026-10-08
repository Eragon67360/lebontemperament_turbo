import { expect, test } from "@playwright/test";

// P1 — the home is the hub (#473): it says what to do and what is coming,
// and every link it offers leads to an existing page. Read-only: nothing is
// clicked; links are checked with GET requests. Every locator is exact and
// scoped, since the page repeats words (« Campagne 40 ans » is a card's h2
// and a job card's h3).
test("the home shows « À faire » and « À venir » and links to existing pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard");

  const main = page.getByRole("main");
  // « Bonsoir » from 18 h in the browser's time zone (#585).
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(
    /^Bon(jour|soir) /,
  );
  // The count badge joins the name once loaded: « À faire 3 tâches ».
  await expect(
    main.getByRole("heading", { level: 2, name: /^À faire( \d+ tâches?)?$/ }),
  ).toBeVisible();
  await expect(
    main.getByRole("heading", { level: 2, name: "À venir", exact: true }),
  ).toBeVisible();
  await expect(
    main.getByRole("heading", {
      level: 2,
      name: "Que voulez-vous faire ?",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    main.getByRole("heading", {
      level: 2,
      name: "Campagne 40 ans",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    main.getByRole("heading", {
      level: 2,
      name: "Activité récente",
      exact: true,
    }),
  ).toBeVisible();

  // Every section has settled (no skeleton left), so the links are all there.
  await expect(main.locator("[aria-busy='true']")).toHaveCount(0, {
    timeout: 30_000,
  });

  const hrefs = new Set<string>();
  for (const href of await main
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    if (href?.startsWith("/dashboard")) hrefs.add(href);
  }
  // At least the five job cards' entry points and the campaign door.
  expect(hrefs.size).toBeGreaterThan(5);

  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} should exist`).toBeLessThan(400);
  }
});

// P1 — on a phone the hub is one column and never scrolls sideways.
test("the home fits a phone without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", { level: 2, name: /^À faire( \d+ tâches?)?$/ }),
  ).toBeVisible();
  await expect(main.locator("[aria-busy='true']")).toHaveCount(0, {
    timeout: 30_000,
  });

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
});
