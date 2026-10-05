import { expect, test, type Page } from "@playwright/test";

// P1 — read-only. Issue #349: a fresh browser must not talk to Google,
// YouTube or a map provider before the visitor clicks something. Videos and
// the map load behind click-to-load placeholders; analytics wait for consent.
const BLOCKED_HOSTS =
  /(^|\.)(google\.com|gstatic\.com|youtube\.com|youtube-nocookie\.com|ytimg\.com|googleapis\.com|googletagmanager\.com|google-analytics\.com|doubleclick\.net|mapbox\.com)$/i;

const watchThirdParties = (page: Page) => {
  const blocked = new Set<string>();
  page.on("request", (request) => {
    const host = new URL(request.url()).hostname;
    if (BLOCKED_HOSTS.test(host)) blocked.add(host);
  });
  return blocked;
};

for (const path of ["/", "/galerie", "/contact", "/40-ans/archives"]) {
  test(`${path} makes no Google, YouTube or map request before a click`, async ({
    page,
  }) => {
    const blocked = watchThirdParties(page);
    await page.goto(path, { waitUntil: "networkidle" });
    // Give deferred scripts and lazy images their chance to misbehave.
    await page.waitForTimeout(1500);
    expect([...blocked]).toEqual([]);
  });
}

test("a gallery video loads from youtube-nocookie.com only after its play button", async ({
  page,
}) => {
  const blocked = watchThirdParties(page);
  await page.goto("/galerie", { waitUntil: "networkidle" });
  const play = page.getByRole("button", { name: /^Lire la vidéo/ }).first();
  await expect(play).toBeVisible();
  expect(page.locator("iframe[src*='youtube']")).toHaveCount(0);
  expect([...blocked]).toEqual([]);

  await play.click();
  const player = page.locator("iframe[src*='youtube-nocookie.com/embed/']");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("title", /./);
});

test("the contact map needs a click and offers plain links meanwhile", async ({
  page,
}) => {
  await page.goto("/contact", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "Afficher la carte" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /OpenStreetMap/ }),
  ).toHaveAttribute("href", /openstreetmap\.org/);
  await expect(page.getByRole("link", { name: /Google Maps/ })).toHaveAttribute(
    "href",
    /google\.com\/maps/,
  );
});

test("the cookie banner lists only real services and refusing is one click", async ({
  page,
}) => {
  // The banner hides from bots (navigator.webdriver): look like a person.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "webdriver", { get: () => false }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  const banner = page.getByRole("dialog", { name: /cookies/i });
  await expect(banner).toBeVisible();
  await expect(
    banner.getByRole("button", { name: "Tout refuser" }),
  ).toBeVisible();
  await expect(
    banner.getByRole("button", { name: "Tout accepter" }),
  ).toBeVisible();
  await banner.getByRole("button", { name: "Gérer les préférences" }).click();
  const preferences = page.getByRole("dialog", { name: /préférences/i });
  await expect(preferences).toBeVisible();
  for (const absent of [
    "Hotjar",
    "Facebook",
    "Google Ads",
    "AWSALB",
    "Lorem",
  ]) {
    await expect(preferences).not.toContainText(absent);
  }
  await expect(preferences).toContainText("Google Analytics");
  await expect(preferences).toContainText("Vercel");
});

test("each public form carries a data notice linking the privacy policy", async ({
  page,
}) => {
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Formulaire de contact" });
  await expect(
    form.getByRole("link", { name: "politique de confidentialité" }),
  ).toHaveAttribute("href", "/politique-de-confidentialite");
  // The newsletter block of the same page carries its own notice.
  await expect(
    page.getByRole("link", {
      name: "politique de confidentialité",
      exact: true,
    }),
  ).toHaveCount(2);
});
