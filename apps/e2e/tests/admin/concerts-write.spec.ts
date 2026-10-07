import { expect, test } from "@playwright/test";

// P4 — safe-write: creates an E2E_-namespaced concert through the real admin
// UI, verifies it renders, then deletes it through the UI. The row is briefly
// visible on the target site's public pages (today's date is required for it to appear in the admin « À venir » list) —
// hence the unmistakable name. Orphans older than 24h are swept by
// global-teardown.ts.
//
// Off by default: it writes to whichever database the target site uses, so
// it only runs with E2E_ALLOW_WRITES=1. Set it only against staging, which
// has its own database since #363; never against production.
test.skip(
  process.env.E2E_ALLOW_WRITES !== "1",
  "writes to the target's database — set E2E_ALLOW_WRITES=1 to run, staging only (see #363)",
);

test("create and delete an E2E concert", async ({ page }) => {
  const name = `E2E_Concert_${Date.now()}`;

  await page.goto("/dashboard/public/concerts/prochains-concerts");
  await page
    .getByRole("main")
    .locator("header")
    .getByRole("button", { name: "Ajouter un concert", exact: true })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Ajouter un concert",
    exact: true,
  });
  await dialog.locator("#concertName").fill(name);
  await dialog.locator("#place").fill("E2E Salle de test");

  // Date picker (react-day-picker v10): day buttons have full French
  // accessible names, with today prefixed — "Today, samedi 5 septembre 2026".
  // Pick today (substring match): the admin list and the public site both
  // filter on date >= today.
  await dialog
    .getByRole("button", { name: "Choisir une date", exact: true })
    .click();
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  await page.getByRole("button", { name: todayLabel }).click();
  // The popover is modal and does not close on selection — dismiss it so the
  // dialog underneath becomes interactive again.
  await page.keyboard.press("Escape");

  await dialog.locator("#time").fill("20:00");
  // The « Type de concert » Select trigger carries the field's id.
  await dialog.locator("#context").click();
  await page.getByRole("option", { name: "Chœur", exact: true }).click();
  await dialog
    .locator("#additional_informations")
    .fill(`E2E run ${new Date().toISOString()} — safe to delete`);

  await dialog
    .getByRole("button", { name: "Créer le concert", exact: true })
    .click();
  await expect(
    page.getByText(`« ${name} » ajouté aux prochains concerts`, {
      exact: true,
    }),
  ).toBeVisible();

  const main = page.getByRole("main");
  const heading = main.getByRole("heading", { name, exact: true });
  await expect(heading).toBeVisible();

  // Delete via the row's button, named by its sr-only suffix
  // ("Supprimer « <name> »", apps/admin/components/concerts/ConcertRow.tsx).
  await main
    .getByRole("button", { name: `Supprimer « ${name} »`, exact: true })
    .click();
  const confirm = page.getByRole("alertdialog", {
    name: `Supprimer « ${name} » ?`,
    exact: true,
  });
  await confirm.getByRole("button", { name: "Supprimer", exact: true }).click();

  await expect(
    page.getByText(`« ${name} » supprimé`, { exact: true }),
  ).toBeVisible();
  await expect(heading).toBeHidden();
});
