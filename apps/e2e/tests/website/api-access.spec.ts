import { expect, test } from "@playwright/test";

// Access checks on the website API. Read-only: GET requests, plus OPTIONS
// (answered by Next.js from the exported handlers, no handler code runs) to
// see which methods a route still accepts. Runs without a session.

const FAKE_DRIVE_ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123";

test.describe("removed website routes", () => {
  for (const path of [
    "/api/members",
    "/api/check-group-member?email=member@example.com",
    "/api/cds",
    "/api/create-checkout-session",
    "/api/cookies",
  ]) {
    test(`GET ${path} is gone (404)`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
    });
  }
});

test.describe("read-only website routes", () => {
  for (const path of [
    "/api/prochains-concerts",
    "/api/projects",
    "/api/drive/files",
    "/api/drive/file",
  ]) {
    test(`${path} only allows reads`, async ({ request }) => {
      const response = await request.fetch(path, { method: "OPTIONS" });
      const allow = (response.headers()["allow"] ?? "")
        .split(",")
        .map((method) => method.trim().toUpperCase())
        .filter(Boolean);
      expect(allow).toContain("GET");
      for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
        expect(allow).not.toContain(method);
      }
    });
  }
});

test.describe("members-only routes refuse anonymous callers", () => {
  for (const path of [
    `/api/drive/files?folderID=${FAKE_DRIVE_ID}`,
    `/api/drive/file?fileId=${FAKE_DRIVE_ID}`,
    "/api/membres",
    "/api/cas",
    "/api/rehearsals",
  ]) {
    test(`GET ${path} without a session is 401`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: "Non authentifié" });
    });

    test(`GET ${path} with an invalid bearer token is 401`, async ({
      request,
    }) => {
      const response = await request.get(path, {
        headers: { Authorization: "Bearer not-a-valid-token" },
      });
      expect(response.status()).toBe(401);
    });
  }
});

test("the CD catalogue renders without calling an API", async ({ page }) => {
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/cds")) {
      apiCalls.push(request.url());
    }
  });

  await page.goto("/concerts/autres");
  const cds = page.getByRole("button", { name: /^Voir / });
  await expect(cds.first()).toBeVisible();
  await expect(cds.first().getByRole("img")).toBeVisible();
  expect(apiCalls).toEqual([]);
});
