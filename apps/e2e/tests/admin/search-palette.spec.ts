import { expect, test } from "@playwright/test";

// UI-002 (audit 2026-10-26) — the ⌘K palette has no DialogTrigger, so Radix
// gave the focus back to nothing when it closed: after Enter on
// « Rechercher » and Escape, the focus sat on the page body. Read-only.
test("Escape in the search palette gives the focus back to « Rechercher »", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard");

  const search = page.getByRole("button", { name: /^Rechercher/ });
  await search.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Rechercher" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(search).toBeFocused();
});

// UI-002 — the item the arrow keys land on must be visible in dark mode too:
// its background differs from the menu's (it used to be the same colour) and
// it carries the teal left mark. Read-only: the account menu is only opened
// and closed.
test("the highlighted menu item stands out from its menu in dark mode", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard");

  const account = page.getByRole("button", { name: /^Compte de / });
  await account.focus();
  await page.keyboard.press("Enter");

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await page.keyboard.press("ArrowDown");

  const highlighted = menu.locator("[data-highlighted]").first();
  await expect(highlighted).toBeVisible();
  const [itemBackground, menuBackground] = await Promise.all([
    highlighted.evaluate((el) => getComputedStyle(el).backgroundColor),
    menu.evaluate((el) => getComputedStyle(el).backgroundColor),
  ]);
  expect(itemBackground).not.toBe(menuBackground);
  await expect(highlighted).toHaveCSS("box-shadow", /inset/);

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(account).toBeFocused();
});
