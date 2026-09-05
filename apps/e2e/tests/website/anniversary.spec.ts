import { expect, test } from "@playwright/test";

// P1 — read-only. The production DB currently has no public archive
// documents, so the PDF viewer itself cannot be exercised; this covers the
// archives page UI including its empty state. Revisit once a public archive
// exists (assert .react-pdf__Page canvas renders).
test("40-ans archives page renders search UI", async ({ page }) => {
  const response = await page.goto("/40-ans/archives");
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole("searchbox", { name: "Rechercher dans les archives" }),
  ).toBeVisible();
  await expect(page.getByText(/documents trouvés/)).toBeVisible();
});

// NOTE: /40-ans currently returns 404 on staging (feature flag off), so the
// public audio player (AudioMemories) has no reachable host page. The members
// audio player lives behind website auth — deferred to the /membres phase.
