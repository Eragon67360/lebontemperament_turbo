import { expect, test } from "@playwright/test";

// Read-only. The newsletter form of /contact (audit UI-008): a real label,
// the error linked to the field, Enter submits. The one submission goes to
// a stubbed /api/subscribe: the real route writes a subscriber and sends
// e-mails, so no request may ever reach it from here.
const form = (page: import("@playwright/test").Page) =>
  page.getByRole("form", { name: "Inscription à la newsletter" });

test.beforeEach(async ({ page }) => {
  await page.goto("/contact");
});

test("the e-mail field has a visible label and announces its error", async ({
  page,
}) => {
  const email = form(page).getByLabel("Adresse e-mail");
  await expect(email).toBeVisible();
  await expect(
    form(page).getByText("Adresse e-mail", { exact: true }),
  ).toBeVisible();

  await email.fill("abc");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  const alert = form(page).getByRole("alert");
  await expect(alert).toHaveText("Veuillez entrer une adresse email valide");
  // The message is what the field is described by
  const describedBy = await email.evaluate((el) =>
    (el.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .join(" "),
  );
  expect(describedBy).toContain("Veuillez entrer une adresse email valide");
});

test("Enter in the field submits the address", async ({ page }) => {
  await page.route("**/api/subscribe", (route) =>
    route.fulfill({ status: 200, json: {} }),
  );
  const email = form(page).getByLabel("Adresse e-mail");
  await email.fill("membre@example.com");
  const request = page.waitForRequest("**/api/subscribe");
  await email.press("Enter");
  expect((await request).postDataJSON()).toMatchObject({
    email: "membre@example.com",
  });
  await expect(
    page.getByText("Merci d'avoir souscrit à la Newsletter"),
  ).toBeVisible();
});
