import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
// Local env, then repo-root env as fallback (Supabase URL/service key for the
// teardown sweeper already live in the root .env.local used by the apps).
// Merge manually: first file wins per key, but empty placeholder values are
// skipped so a fallback file can still supply the real value.
import { existsSync, readFileSync } from "node:fs";

for (const path of [".env.local", ".env", "../../.env.local"]) {
  if (!existsSync(path)) continue;
  for (const [key, value] of Object.entries(dotenv.parse(readFileSync(path)))) {
    if (value !== "" && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Vercel Deployment Protection bypass (admin staging is behind Vercel Auth).
const bypassHeaders = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    }
  : undefined;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "blob" : "html",
  use: {
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "website",
      testDir: "./tests/website",
      use: {
        baseURL: process.env.WEBSITE_URL ?? "https://dev.lebontemperament.com",
        extraHTTPHeaders: bypassHeaders,
      },
    },
    {
      name: "admin",
      testDir: "./tests/admin",
      use: {
        baseURL:
          process.env.ADMIN_URL ?? "https://admin-dev.lebontemperament.com",
        storageState: ".auth/admin.json",
        extraHTTPHeaders: bypassHeaders,
      },
    },
    {
      name: "website-members",
      testDir: "./tests/website-members",
      use: {
        baseURL: process.env.WEBSITE_URL ?? "https://dev.lebontemperament.com",
        storageState: ".auth/website.json",
        extraHTTPHeaders: bypassHeaders,
      },
    },
  ],
});
