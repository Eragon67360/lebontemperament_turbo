import { expect, test } from "@playwright/test";

// P1 — read-only. Hits the real Cloudinary CDN on purpose: tagged @live-cdn
// so a CDN outage fails this test alone, not the whole suite.
test(
  "gallery photos load from Cloudinary",
  { tag: "@live-cdn" },
  async ({ page }) => {
    await page.goto("/galerie");
    // The gallery grid must render Cloudinary URLs...
    const firstImage = page.locator("#photos img").first();
    await expect(firstImage).toBeAttached();
    const src = await firstImage.getAttribute("src");
    expect(src).toContain("res.cloudinary.com");
    // ...and the CDN must actually serve them. Checked via request rather
    // than naturalWidth: native lazy-loading never fires reliably in
    // headless Chromium, so the browser may never start the fetch.
    const response = await page.request.get(src!);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image");
  },
);
