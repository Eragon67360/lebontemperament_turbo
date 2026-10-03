import { expect, test } from "@playwright/test";

// P1 — read-only. Opens the new-concert dialog and submits it empty: the form
// must show its inline errors and send nothing (#338). Every non-GET request
// is aborted, so even a validation regression can never write to the database
// (staging shares it with production).
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
  await page.getByRole("button", { name: "Nouveau concert" }).click();
  const dialog = page.getByRole("dialog", { name: "Ajouter un concert" });
  await dialog.getByRole("button", { name: "Créer le concert" }).click();

  await expect(dialog.getByText("Le lieu est requis")).toBeVisible();
  await expect(dialog.getByText("L'heure est requise")).toBeVisible();
  await expect(dialog.locator("#place")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(writes).toEqual([]);
});
