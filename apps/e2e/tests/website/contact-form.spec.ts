import { expect, test } from "@playwright/test";

// P1 — validation-only. The submit button stays disabled until reCAPTCHA is
// solved, which automation cannot do by design — so no real submission can
// ever leave the browser (the /api/contact route would send a real email
// via nodemailer and is classified risky-write).
const form = (page: import("@playwright/test").Page) =>
  page.getByRole("form", { name: "Formulaire de contact" });

test.beforeEach(async ({ page }) => {
  await page.goto("/contact");
});

test("invalid email shows a validation error", async ({ page }) => {
  const email = form(page).getByLabel("Email");
  await email.fill("not-an-email");
  await email.blur();
  await expect(
    page.getByText("Veuillez entrer une adresse email valide"),
  ).toBeVisible();
});

test("short message shows a validation error", async ({ page }) => {
  const message = form(page).getByLabel("Message");
  await message.fill("short");
  await message.blur();
  await expect(
    page.getByText("Le message doit contenir au moins 10 caractères"),
  ).toBeVisible();
});

test("submit stays disabled without reCAPTCHA", async ({ page }) => {
  await form(page).getByLabel("Email").fill("e2e@example.com");
  await form(page)
    .getByLabel("Message")
    .fill("Un message suffisamment long pour être valide.");
  await expect(
    form(page).getByRole("button", { name: "Envoyer un mail" }),
  ).toBeDisabled();
});
