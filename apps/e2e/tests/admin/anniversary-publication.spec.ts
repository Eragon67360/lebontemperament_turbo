import { expect, test } from "@playwright/test";

// P0 — read-only. The publication of the 40 ans page is a deliberate step
// (#464): the dialog names the effect on the public site and its confirm
// stays disabled until « J'ai vérifié le contenu » is ticked. The test
// closes the dialog with « Annuler », never confirms, and aborts every
// non-GET request so that even a regression could not flip the flag
// (staging shares the production database).
test("publishing the 40 ans page asks for a check and can be cancelled", async ({
  page,
}) => {
  const writes: string[] = [];
  // Only the admin API: a Supabase token refresh must not be caught here.
  await page.route("**/api/**", (route) => {
    const request = route.request();
    if (request.method() === "GET" || request.method() === "HEAD") {
      return route.continue();
    }
    writes.push(`${request.method()} ${request.url()}`);
    return route.abort();
  });

  await page.goto("/dashboard/admin/anniversary");
  await expect(
    page.getByRole("heading", { name: "Vue d’ensemble et publication" }),
  ).toBeVisible();

  // The checklist has one row per section, computed by the readiness route.
  await expect(page.getByText(/sections? prêtes? sur 10/)).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ hasText: "Chronologie" }),
  ).toBeVisible();

  // Whatever the current state, the opposite action opens the dialog.
  const publish = page.getByRole("button", { name: "Publier la page" });
  const hide = page.getByRole("button", { name: "Masquer la page" });
  await expect(publish.or(hide)).toBeVisible();
  const published = await hide.isVisible();
  await (published ? hide : publish).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(
    published
      ? "renvoie une erreur 404"
      : "devient visible par tous les visiteurs",
  );

  const confirm = dialog.getByRole("button", {
    name: published ? "Masquer la page" : "Publier la page",
  });
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("checkbox").click();
  await expect(confirm).toBeEnabled();

  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(dialog).toBeHidden();
  expect(writes).toEqual([]);
});

// P1 — read-only. A campaign dialog validates inline, in French, and sends
// nothing when submitted empty; closing it after a change asks first.
test("a campaign dialog shows inline errors, sends nothing and guards unsaved changes", async ({
  page,
}) => {
  const writes: string[] = [];
  // Only the admin API: a Supabase token refresh must not be caught here.
  await page.route("**/api/**", (route) => {
    const request = route.request();
    if (request.method() === "GET" || request.method() === "HEAD") {
      return route.continue();
    }
    writes.push(`${request.method()} ${request.url()}`);
    return route.abort();
  });

  await page.goto("/dashboard/admin/anniversary/timeline");
  await page
    .getByRole("button", { name: "Ajouter un événement" })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Ajouter un événement" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("champs à corriger");
  await expect(dialog.getByText("L'année est requise")).toBeVisible();
  await expect(dialog.locator("#event-title")).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await dialog.locator("#event-title").fill("Un événement de test");
  await dialog.getByRole("button", { name: "Annuler" }).click();
  const guard = page.getByRole("alertdialog", {
    name: "Abandonner les modifications ?",
  });
  await expect(guard).toBeVisible();
  await guard.getByRole("button", { name: "Abandonner" }).click();
  await expect(dialog).toBeHidden();
  expect(writes).toEqual([]);
});
