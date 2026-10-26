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
    "/api/membres/mes-donnees",
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

// « Voir » opens a score in a tab: a refusal there is a French page, not JSON,
// and is still a 401 (the app and scripts keep getting JSON, above).
test("a score opened in a tab without a session gets a French 401 page", async ({
  request,
}) => {
  const response = await request.get(
    `/api/drive/file?fileId=${FAKE_DRIVE_ID}`,
    { headers: { "Sec-Fetch-Dest": "document" } },
  );
  expect(response.status()).toBe(401);
  expect(response.headers()["content-type"]).toContain("text/html");
  expect(await response.text()).toContain("Ta session a expiré");
});

// The Drive file proxy sends its own sandbox policy, in which nothing runs;
// the site-wide policy (next.config.js) must not replace it.
test("the Drive file proxy's answers carry its sandbox policy", async ({
  request,
}) => {
  const asked: Record<string, string>[] = [
    {},
    { "Sec-Fetch-Dest": "document" },
  ];
  for (const headers of asked) {
    const response = await request.get(
      `/api/drive/file?fileId=${FAKE_DRIVE_ID}`,
      { headers },
    );
    expect(response.status()).toBe(401);
    const policy = response.headers()["content-security-policy"] ?? "";
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("sandbox");
    expect(policy).not.toContain("allow-scripts");
    expect(response.headers()["x-content-type-options"]).toContain("nosniff");
  }
});

// #354: a deletion request needs the member's own session.
test("POST /api/membres/demande-suppression without a session is 401", async ({
  request,
}) => {
  const response = await request.post("/api/membres/demande-suppression", {
    data: { message: "test" },
  });
  expect(response.status()).toBe(401);
});

test.describe("POST /api/revalidate is secret-protected", () => {
  // 503 while REVALIDATE_SECRET is unset on the deployment, 401 once it is
  // set: never a 200 for a caller without the secret.
  test("refuses a call without the secret", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      data: { paths: ["/concerts"] },
    });
    expect([401, 503]).toContain(response.status());
  });

  test("refuses a wrong secret", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      headers: { "x-revalidate-secret": "not-the-secret" },
      data: { paths: ["/concerts"] },
    });
    expect([401, 503]).toContain(response.status());
  });

  test("only accepts POST", async ({ request }) => {
    const response = await request.get("/api/revalidate");
    expect(response.status()).toBe(405);
  });
});

test("signed out, /api/events lists public events only", async ({
  request,
}) => {
  const response = await request.get("/api/events");
  expect(response.status()).toBe(200);
  const events = (await response.json()) as { is_public: boolean }[];
  expect(events.filter((event) => !event.is_public)).toEqual([]);
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
