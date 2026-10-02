import { expect, test } from "@playwright/test";

// P4 — safe-write: creates an E2E_-namespaced concert through the real admin
// UI, verifies it renders, then deletes it through the UI. Because staging
// shares the production DB, the row is briefly visible on the public site
// (today's date is required for it to appear in the admin "upcoming" list) —
// hence the unmistakable name. Orphans older than 24h are swept by
// global-teardown.ts.
//
// Off by default: every environment writes to the production database, so
// this spec only runs with E2E_ALLOW_WRITES=1, which nothing sets until
// staging has its own database (#363).
test.skip(
  process.env.E2E_ALLOW_WRITES !== "1",
  "writes to the shared production database — set E2E_ALLOW_WRITES=1 to run (see #363)",
);

test("create and delete an E2E concert", async ({ page }) => {
  const name = `E2E_Concert_${Date.now()}`;

  await page.goto("/dashboard/public/concerts/prochains-concerts");
  await page.getByRole("button", { name: "Nouveau concert" }).click();

  const dialog = page.getByRole("dialog", { name: "Ajouter un concert" });
  await dialog.locator("#concertName").fill(name);
  await dialog.locator("#place").fill("E2E Salle de test");

  // Date picker (react-day-picker v10): day buttons have full French
  // accessible names, with today prefixed — "Today, samedi 5 septembre 2026".
  // Pick today (substring match): the admin list and the public site both
  // filter on date >= today.
  await dialog.getByRole("button", { name: "Choisir une date" }).click();
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
  // The context Select trigger is labelled by <Label htmlFor="context">.
  await dialog.getByRole("combobox", { name: "Contexte" }).click();
  await page.getByRole("option", { name: "Chœur", exact: true }).click();
  await dialog
    .locator("#additional_informations")
    .fill(`E2E run ${new Date().toISOString()} — safe to delete`);

  await dialog.getByRole("button", { name: "Créer le concert" }).click();
  await expect(page.getByText("Concert ajouté")).toBeVisible();

  const heading = page.getByRole("heading", { name });
  await expect(heading).toBeVisible();

  // Delete via the card's trash button, named by its sr-only label
  // ("Supprimer « <name> »", apps/admin/components/concerts/ConcertCard.tsx).
  await page.getByRole("button", { name: `Supprimer « ${name} »` }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Supprimer" })
    .click();

  await expect(page.getByText("Concert supprimé")).toBeVisible();
  await expect(heading).toBeHidden();
});
