import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

// Vercel Deployment Protection bypass (admin staging is behind Vercel Auth).
const bypassHeaders = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    }
  : undefined;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
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
  ],
});
