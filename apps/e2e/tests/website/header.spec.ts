import { expect, test, type Locator, type Page } from "@playwright/test";

// P1 — read-only: the site header is readable on every public page. It is
// drawn white over a dark photo only on the pages that render one (the home,
// a concert story with a banner), and solid with dark text everywhere else
// (audit UI-V-001, #744).

const WHITE = "rgb(255, 255, 255)";

// The site header: the footer repeats the same link names.
const mainNav = (page: Page) =>
  page.getByRole("navigation", { name: "Navigation principale" });

const color = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el).color);

// WCAG contrast of an element's text colour against the page background.
async function contrastWithPage(page: Page, locator: Locator) {
  const fg = await color(locator);
  return page.evaluate((fg) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const luminance = (css: string) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = Array.from(
        ctx.getImageData(0, 0, 1, 1).data,
      ).map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const a = luminance(fg);
    const b = luminance(getComputedStyle(document.body).backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, fg);
}

test.describe("light theme", () => {
  test.use({ colorScheme: "light" });

  test("the CDs page has a readable menu button and links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/concerts/autres");
    const menuButton = mainNav(page).getByRole("button", {
      name: "Ouvrir le menu",
    });
    await expect(menuButton).toBeVisible();
    expect(await contrastWithPage(page, menuButton)).toBeGreaterThan(3);

    await page.setViewportSize({ width: 1280, height: 800 });
    const agenda = mainNav(page).getByRole("link", {
      name: /agenda des concerts/i,
    });
    await expect(agenda).toBeVisible();
    expect(await contrastWithPage(page, agenda)).toBeGreaterThan(4.5);
  });

  test("the home header is white over the photo, then solid past it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const agenda = mainNav(page).getByRole("link", {
      name: /agenda des concerts/i,
    });
    await expect(agenda).toBeVisible();
    // The server HTML already assumes the home's photo; the hero confirms it
    // at hydration, so the header is white from the first paint on.
    await expect.poll(() => color(agenda)).toBe(WHITE);

    await page.evaluate(() => window.scrollTo(0, window.innerHeight + 200));
    await expect.poll(() => color(agenda)).not.toBe(WHITE);
    expect(await contrastWithPage(page, agenda)).toBeGreaterThan(4.5);
  });

  test("a concert story draws the white header only over a banner", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/concerts");
    const stories = page.locator('a[href^="/concerts/"]:not([href*="autres"])');
    const hrefs = Array.from(
      new Set(
        await stories.evaluateAll((links) =>
          links.map((link) => link.getAttribute("href") ?? ""),
        ),
      ),
    ).slice(0, 3);
    test.skip(hrefs.length === 0, "no concert story published");

    for (const href of hrefs) {
      await page.goto(href);
      const hero = page.getByTestId("hero");
      await expect(hero).toBeVisible();
      const hasBanner = (await hero.locator("img").count()) > 0;
      const agenda = mainNav(page).getByRole("link", {
        name: /agenda des concerts/i,
      });
      const linkColor = expect.poll(() => color(agenda), {
        message: `${href} banner=${hasBanner}`,
      });
      if (hasBanner) await linkColor.toBe(WHITE);
      else await linkColor.not.toBe(WHITE);
    }
  });
});
