import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const AUTH_DIR = path.join(import.meta.dirname, ".auth");

// Vercel Deployment Protection bypass (staging is behind Vercel Auth).
const bypassHeaders = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    }
  : undefined;

// Logs in once per host and saves the session for the authenticated projects.
// Credentials come from env only — never hardcode them.
async function saveLogin(
  baseURL: string,
  successUrl: string,
  file: string,
  email: string,
  password: string,
) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    extraHTTPHeaders: bypassHeaders,
  });
  const page = await context.newPage();

  await page.goto(`${baseURL}/auth/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(`**${successUrl}`);

  await context.storageState({ path: file });
  await browser.close();
}

export default async function globalSetup() {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  const adminURL =
    process.env.ADMIN_URL ?? "https://admin-dev.lebontemperament.com";
  const websiteURL =
    process.env.WEBSITE_URL ?? "https://dev.lebontemperament.com";

  mkdirSync(AUTH_DIR, { recursive: true });

  if (!email || !password) {
    console.warn(
      "[e2e] E2E_USER_EMAIL/E2E_USER_PASSWORD not set — authenticated tests will fail.",
    );
    for (const file of ["admin.json", "website.json"]) {
      writeFileSync(
        path.join(AUTH_DIR, file),
        JSON.stringify({ cookies: [], origins: [] }),
      );
    }
    return;
  }

  // Admin login lands on /dashboard; website login lands on /membres.
  await saveLogin(
    adminURL,
    "/dashboard",
    path.join(AUTH_DIR, "admin.json"),
    email,
    password,
  );
  await saveLogin(
    websiteURL,
    "/membres",
    path.join(AUTH_DIR, "website.json"),
    email,
    password,
  );
}
