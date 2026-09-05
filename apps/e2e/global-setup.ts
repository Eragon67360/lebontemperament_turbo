import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const AUTH_FILE = path.join(import.meta.dirname, ".auth", "admin.json");

// Logs in once on the admin host and saves the session for the `admin` project.
// Credentials come from env only — never hardcode them.
export default async function globalSetup() {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  const adminURL =
    process.env.ADMIN_URL ?? "https://admin-dev.lebontemperament.com";

  mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  if (!email || !password) {
    console.warn(
      "[e2e] E2E_USER_EMAIL/E2E_USER_PASSWORD not set — authenticated admin tests will fail.",
    );
    writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Vercel Deployment Protection bypass (admin staging is behind Vercel Auth).
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass":
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        }
      : undefined,
  });
  const page = await context.newPage();

  await page.goto(`${adminURL}/auth/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard");

  await context.storageState({ path: AUTH_FILE });
  await browser.close();
}
