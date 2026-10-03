import { expect, test } from "@playwright/test";

// P1 — validation-only, plus one submission against a mocked /api/contact.
// The real route sends an email through the association's mailbox, so no
// request may ever reach it from here: every submit test intercepts the call.
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

test("submit enables once email and message are valid, without any captcha", async ({
  page,
}) => {
  const submit = form(page).getByRole("button", { name: "Envoyer un mail" });
  await expect(submit).toBeDisabled();
  await form(page).getByLabel("Email").fill("e2e@example.com");
  await form(page)
    .getByLabel("Message")
    .fill("Un message suffisamment long pour être valide.");
  await expect(submit).toBeEnabled();
  await expect(page.locator("iframe[src*='recaptcha']")).toHaveCount(0);
});

test("a filled honeypot still gets the neutral success answer (mocked route)", async ({
  page,
}) => {
  const neutral = {
    success: true,
    message: "Votre demande de contact a bien été envoyée",
  };
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/contact", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: neutral });
  });

  await form(page).getByLabel("Email").fill("e2e@example.com");
  await form(page)
    .getByLabel("Message")
    .fill("Un message suffisamment long pour être valide.");
  // The honeypot is off-screen: only a script (or a bot) can fill it.
  await form(page)
    .locator("input[name='website']")
    .evaluate((input: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, "https://spam.example.com");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  await form(page).getByRole("button", { name: "Envoyer un mail" }).click();

  await expect(
    page.getByText("Votre demande a bien été envoyée"),
  ).toBeVisible();
  expect(sent).toMatchObject({
    email: "e2e@example.com",
    website: "https://spam.example.com",
  });
  expect(typeof sent?.fillTimeMs).toBe("number");
  expect(sent).not.toHaveProperty("captchaValue");
});
