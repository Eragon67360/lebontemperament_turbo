import { expect, test } from "@playwright/test";

// P1 — read-only. Opens the new-concert dialog and submits it empty: the form
// must show its inline errors and the summary, and send nothing (#338, #480).
// Every non-GET request is aborted, so even a validation regression can never
// write to the database (staging shares it with production).
test("concert form shows inline errors and sends nothing when empty", async ({
  page,
}) => {
  const writes: string[] = [];
  await page.route("**/*", (route) => {
    const request = route.request();
    if (request.method() === "GET" || request.method() === "HEAD") {
      return route.continue();
    }
    writes.push(`${request.method()} ${request.url()}`);
    return route.abort();
  });

  await page.goto("/dashboard/public/concerts/prochains-concerts");
  // The page header's primary (the empty state offers « Programmer un concert »).
  await page
    .getByRole("main")
    .locator("header")
    .getByRole("button", { name: "Ajouter un concert", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Ajouter un concert",
    exact: true,
  });
  await dialog
    .getByRole("button", { name: "Créer le concert", exact: true })
    .click();

  // The summary lists the fields to fix, each as a link to its field.
  const summary = dialog.getByRole("alert");
  await expect(summary).toContainText("champs à corriger");
  await expect(
    summary.getByRole("link", { name: "Lieu", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Le lieu est requis", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("L'heure est requise", { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator("#place")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(writes).toEqual([]);
});
