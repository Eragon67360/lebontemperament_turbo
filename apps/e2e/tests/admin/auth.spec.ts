import { expect, test } from "@playwright/test";

// P0 — auth guards. The happy-path login is covered by global-setup
// (it must reach /dashboard for any admin test to run).

test.describe("unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth\/login/);
  });

  test("wrong credentials redirect back with an error", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator("#email").fill("nobody@example.com");
    await page.locator("#password").fill("wrong-password");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/auth\/login\?error=/);
  });
});
