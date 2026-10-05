// Runs the repo's logged-in admin specs against a protected Vercel preview
// without the deployment-protection bypass secret. See ../README.md.
import { defineConfig } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: join(here, "../../../apps/e2e/tests/admin"),
  globalSetup: join(here, "setup.mjs"),
  workers: 2,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: process.env.ADMIN_URL,
    storageState: process.env.PW_STATE,
    trace: "off",
  },
});
