import { expect, test } from "@playwright/test";

// P0 — read-only smoke: every public page renders with a 200 and a title.
const PUBLIC_PAGES = [
  "/",
  "/concerts",
  "/galerie",
  "/contact",
  "/don",
  "/decouvrir",
  "/rejoindre",
  "/faq",
];

for (const path of PUBLIC_PAGES) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle(/.+/);
  });
}
