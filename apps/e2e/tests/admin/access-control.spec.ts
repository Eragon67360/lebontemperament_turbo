import { expect, test } from "@playwright/test";

// Access control on the admin (#313). Read-only: GET requests and page
// loads only, as an anonymous visitor. Every admin API route must answer 401
// before reading anything, and admin pages must send visitors to the login.

test.use({ storageState: { cookies: [], origins: [] } });

// A syntactically valid id that matches no row.
const NO_ID = "00000000-0000-4000-8000-000000000000";

// Every GET handler under apps/admin/app/api (keep in sync when adding one).
const ADMIN_GET_ROUTES = [
  "/api/activities",
  "/api/anniversary/archives",
  "/api/anniversary/audio",
  "/api/anniversary/form-config",
  "/api/anniversary/hero",
  "/api/anniversary/hero-stats",
  "/api/anniversary/memories",
  "/api/anniversary/navigation",
  "/api/anniversary/photos",
  "/api/anniversary/readiness",
  "/api/anniversary/timeline",
  "/api/anniversary/videos",
  "/api/bug-messages",
  "/api/cas",
  "/api/drive-folders",
  "/api/drive-sync",
  "/api/events",
  "/api/feature-flags",
  `/api/files?programId=${NO_ID}&groupId=${NO_ID}`,
  `/api/folders?programId=${NO_ID}&groupId=${NO_ID}`,
  "/api/google-groups",
  "/api/members/excel",
  "/api/my-bug-reports",
  "/api/prochains-concerts",
  "/api/projects",
  `/api/projects/${NO_ID}`,
  "/api/rehearsals",
  `/api/rehearsals/${NO_ID}`,
  "/api/tours",
  "/api/users",
  "/api/users/sync",
  "/api/videos",
];

test.describe("admin API, anonymous", () => {
  for (const route of ADMIN_GET_ROUTES) {
    test(`GET ${route} answers 401`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: expect.any(String) });
    });
  }
});

test.describe("admin pages, anonymous", () => {
  for (const path of ["/dashboard", "/dashboard/admin/users"]) {
    test(`${path} redirects to the login page`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect([302, 303, 307, 308]).toContain(response.status());
      expect(response.headers()["location"]).toMatch(/\/auth\/login/);
    });
  }

  test("login page is reachable and sends the security headers", async ({
    request,
  }) => {
    const response = await request.get("/auth/login");
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'self'",
    );
  });
});
