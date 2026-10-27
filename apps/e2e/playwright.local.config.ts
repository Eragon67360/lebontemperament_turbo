import { defineConfig } from "@playwright/test";

/**
 * Checks of the website that run against a local `next dev`. The browser's
 * calls to the outside are answered by the test itself: no credentials, no
 * staging, no `.auth` state, nothing written anywhere. The dev server still
 * renders the root layout, which reads the public feature flags and site
 * settings from the Supabase project its environment names (read-only).
 *
 *   npm run test:local -w e2e
 *
 * Playwright starts the website on port 4121, or reuses a server already
 * listening there; `LOCAL_WEBSITE_URL` points it at another one. The map
 * needs a public-looking token to initialise: a placeholder does, as the
 * tests serve the map style themselves.
 */
const PORT = 4121;
const baseURL = process.env.LOCAL_WEBSITE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/local",
  outputDir: "./test-results/local",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // The first visit compiles the page.
  timeout: 180_000,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: process.env.LOCAL_WEBSITE_URL
    ? undefined
    : {
        command: `npx next dev --turbopack -p ${PORT}`,
        cwd: "../website",
        url: `${baseURL}/track`,
        reuseExistingServer: true,
        timeout: 240_000,
        env: {
          NEXT_PUBLIC_MAPBOX_API_KEY:
            process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "pk.placeholder",
        },
      },
});
