import { expect, test } from "@playwright/test";

// P2 — authenticated member area on the public website, read-only.
// Session saved by global-setup (.auth/website.json).
const MEMBER_PAGES = [
  "/membres",
  "/membres/calendrier",
  "/membres/concerts",
  "/membres/travail",
  "/membres/administration",
  "/membres/membres",
  "/membres/mes-donnees",
];

for (const path of MEMBER_PAGES) {
  test(`${path} loads for a logged-in member`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    // Auth gate: must not bounce back to the login page.
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("main")).toBeVisible();
  });
}

// #350: members see each other's name, email, voice and photo, nothing else.
// Only key names are compared, so a failure never prints member data.
test("/api/membres returns only the shared directory fields", async ({
  request,
}) => {
  const response = await request.get("/api/membres");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const members: Record<string, unknown>[] = await response.json();
  expect(members.length).toBeGreaterThan(0);
  const allowed = new Set(["NOM Prénom", "Adresse mail", "Voix", "photoUrl"]);
  const extraKeys = [
    ...new Set(members.flatMap((member) => Object.keys(member))),
  ].filter((key) => !allowed.has(key));
  expect(extraKeys).toEqual([]);
});

// #354: « Télécharger mes données » returns the caller's own data only, as a
// file. Only ids and key names are compared, so a failure never prints
// member data. (The deletion request is not sent here: it e-mails the
// association's real mailbox.)
test("/api/membres/mes-donnees exports the member's own account", async ({
  request,
}) => {
  const response = await request.get("/api/membres/mes-donnees");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toMatch(
    /^attachment; filename="mes-donnees-le-bon-temperament-\d{4}-\d{2}-\d{2}\.json"$/,
  );
  expect(response.headers()["cache-control"]).toContain("no-store");
  const data = await response.json();
  expect(Object.keys(data)).toEqual(
    expect.arrayContaining(["export", "compte", "profil", "signalements"]),
  );
  const accountId: unknown = data.compte?.id;
  expect(typeof accountId).toBe("string");
  expect(data.profil === null || data.profil.id === accountId).toBe(true);
  for (const section of ["notifications", "signalements"]) {
    expect(Array.isArray(data[section]) || "erreur" in data[section]).toBe(
      true,
    );
  }
});

// Guard check: logged-out visitors must be redirected away.
test.describe("unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/membres redirects to login", async ({ page }) => {
    await page.goto("/membres");
    await page.waitForURL(/\/auth\/login/);
  });
});
