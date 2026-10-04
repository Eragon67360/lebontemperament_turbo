// Global setup: the Vercel share link sets the deployment-protection cookie,
// then the e2e account signs in; the session is saved for the specs.
import { chromium } from "@playwright/test";

export default async function globalSetup() {
  const { ADMIN_URL: base, SHARE_ADMIN: share, PW_STATE: state } = process.env;
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!base || !share || !state || !email || !password) {
    throw new Error(
      "Set ADMIN_URL, SHARE_ADMIN, PW_STATE, E2E_USER_EMAIL and E2E_USER_PASSWORD.",
    );
  }
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(share);
  await page.goto(`${base}/auth/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard**");
  await context.storageState({ path: state });
  await browser.close();
}
