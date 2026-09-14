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
