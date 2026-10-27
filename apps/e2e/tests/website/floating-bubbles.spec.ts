import { expect, test, type Page } from "@playwright/test";

// Read-only. The floating bubbles of the public pages (audit UI-007): the
// social bubble on every page, the featured-videos bubble on the home. The
// videos come from a stubbed /api/videos so the checks don't depend on the
// rows of the target database.
const FAKE_VIDEOS = [1, 2, 3].map((i) => ({
  id: i,
  title: `Vidéo d'essai ${i}`,
  composer: `Compositeur ${i}`,
  venue: "Salle d'essai",
  youtube_url: `https://www.youtube.com/watch?v=abcdefghij${i}`,
  performance_date: "2026-01-01",
  soloists: null,
  display_order: i,
}));

const socialBubble = (page: Page) =>
  page.getByRole("button", { name: "Nos réseaux sociaux" });
const videosBubble = (page: Page) =>
  page.getByRole("button", { name: "Vidéos à la une" });

async function openHome(page: Page) {
  await page.route("**/api/videos", (route) =>
    route.fulfill({ json: FAKE_VIDEOS }),
  );
  await page.goto("/");
}

test("the featured-videos panel names its controls and closes on Escape", async ({
  page,
}) => {
  await openHome(page);
  await videosBubble(page).focus();
  await page.keyboard.press("Enter");

  const panel = page.getByRole("dialog", { name: "À la une" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Fermer" })).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Vidéo précédente" }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Vidéo suivante" }),
  ).toBeVisible();
  // The bubble is gone while the panel shows: the focus moved into the panel
  await expect(panel).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(videosBubble(page)).toBeFocused();
});

test("the social list closes on Escape and gives the focus back", async ({
  page,
}) => {
  await page.goto("/contact");
  const bubble = socialBubble(page);
  test.skip(
    (await bubble.count()) === 0,
    "no social links published on this target",
  );

  await bubble.focus();
  await page.keyboard.press("Enter");
  await expect(bubble).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.locator("#social-links").getByRole("link").first(),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(bubble).toHaveAttribute("aria-expanded", "false");
  await expect(bubble).toBeFocused();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the open menu covers the bubbles", async ({ page }) => {
    await openHome(page);
    const bubble = socialBubble(page);
    const box = await bubble.boundingBox();
    expect(box).not.toBeNull();

    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await expect(page.locator("#main-menu")).toBeVisible();

    const onTop = await page.evaluate(
      ({ x, y }) => {
        // The dev overlay of `next dev` is not part of the page
        const [element] = document
          .elementsFromPoint(x, y)
          .filter((el) => el.tagName !== "NEXTJS-PORTAL");
        return element?.closest("#main-menu") ? "menu" : element?.tagName;
      },
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
    );
    expect(onTop).toBe("menu");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the social bubble keeps one network instead of cycling", async ({
    page,
  }) => {
    await page.goto("/contact");
    const bubble = socialBubble(page);
    test.skip(
      (await bubble.count()) === 0,
      "no social links published on this target",
    );
    const look = () => bubble.evaluate((el) => el.className);
    const first = await look();
    // The closed bubble changes network every 3 s unless motion is reduced
    await page.waitForTimeout(3500);
    expect(await look()).toBe(first);
  });
});
