import { expect, test } from "@playwright/test";

// Safe-write: creates an E2E_-namespaced members-only event through the real
// admin UI, attaches a PDF and a Word file (« Joindre un document »),
// checks the PDF's public address serves it, removes the PDF, then deletes
// the event with its remaining file. Orphans older than 24h are swept by
// global-teardown.ts.
//
// Off by default: it only runs with E2E_ALLOW_WRITES=1 (set by the e2e
// workflow) AND when the signed-in session belongs to the staging database
// (#363), so it skips itself against production even if the flag is set.
test.skip(
  process.env.E2E_ALLOW_WRITES !== "1",
  "writes to the target's database — set E2E_ALLOW_WRITES=1 to run, staging only (see #363)",
);

const STAGING_REF = "cevuqyhwtzjujxsocxkb";

const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
  "latin1",
);
// Only the first bytes are checked: a .docx is a zip.
const DOCX = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from("E2E test file, safe to delete"),
]);

test("attach, open and remove event documents", async ({ page, request }) => {
  const cookies = await page.context().cookies();
  test.skip(
    !cookies.some((c) => c.name.startsWith(`sb-${STAGING_REF}-auth-token`)),
    "the target is not signed in to the staging database — no writes",
  );

  const name = `E2E_Event_${Date.now()}`;
  const main = page.getByRole("main");
  // CSS locators for « is it gone? » checks: unlike role locators they also
  // match content under aria-hidden, so a count of 0 means the element has
  // left the DOM, never that an open layer is hiding it.
  const dialogs = page.locator('[role="dialog"]');
  const alertDialogs = page.locator('[role="alertdialog"]');

  // 1. A members-only event today.
  await page.goto("/dashboard/members/evenements");
  await main
    .locator("header")
    .getByRole("button", { name: "Ajouter un événement", exact: true })
    .click();
  const form = page.getByRole("dialog", {
    name: "Ajouter un événement",
    exact: true,
  });
  await form.locator("#event-title").fill(name);
  await form.locator("#event-date-from").click();
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  await page.getByRole("button", { name: todayLabel }).click();
  await page.keyboard.press("Escape");
  await form.locator("#event-time").fill("20:00");
  await form.locator("#event-location").fill("E2E Salle de test");
  await form.locator("#event-responsible").fill("E2E Testeur");
  await form
    .getByRole("button", { name: "Créer l'événement", exact: true })
    .click();
  await expect(
    page.getByText(`« ${name} » ajouté à l'agenda des membres`, {
      exact: true,
    }),
  ).toBeVisible();

  // 2. Attach a PDF, then a Word file.
  await main
    .getByRole("button", {
      name: `Joindre un document à « ${name} »`,
      exact: true,
    })
    .click();
  const documents = page.getByRole("dialog", {
    name: `Documents de « ${name} »`,
    exact: true,
  });
  const attach = async (file: string, mimeType: string, buffer: Buffer) => {
    await documents
      .locator("#event-document-file")
      .setInputFiles({ name: file, mimeType, buffer });
    await documents
      .getByRole("button", { name: "Joindre", exact: true })
      .click();
  };
  await attach("Bulletin E2E.pdf", "application/pdf", PDF);
  await expect(
    page.getByText(`« Bulletin E2E » joint à « ${name} »`, { exact: true }),
  ).toBeVisible();
  await attach(
    "Tarifs E2E.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    DOCX,
  );
  await expect(
    page.getByText(`« Tarifs E2E » joint à « ${name} »`, { exact: true }),
  ).toBeVisible();

  // 3. The PDF's public address serves it.
  const open = documents.getByRole("link", {
    name: "Ouvrir « Bulletin E2E » (nouvel onglet)",
    exact: true,
  });
  const href = await open.getAttribute("href");
  expect(href).toContain("/storage/v1/object/public/site-media/events/");
  const file = await request.get(href!);
  expect(file.ok()).toBe(true);
  expect((await file.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  // 4. Remove the PDF.
  await documents
    .getByRole("button", { name: "Retirer « Bulletin E2E »", exact: true })
    .click();
  await page
    .getByRole("alertdialog", {
      name: "Retirer « Bulletin E2E » ?",
      exact: true,
    })
    .getByRole("button", { name: "Retirer", exact: true })
    .click();
  await expect(
    page.getByText("« Bulletin E2E » retiré", { exact: true }),
  ).toBeVisible();
  // The toast shows while the confirmation still plays its exit animation.
  // Until it unmounts it stays the top layer: everything else is aria-hidden
  // (so role locators match nothing) and it swallows the Escape meant for
  // the documents dialog. Wait for it to be gone first.
  await expect(alertDialogs).toHaveCount(0);
  await expect(dialogs.getByText("Bulletin E2E", { exact: true })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(dialogs).toHaveCount(0);
  await expect(
    main.getByRole("button", {
      name: `Documents (1) à « ${name} »`,
      exact: true,
    }),
  ).toBeVisible();

  // 5. Delete the event, its Word file with it.
  await main
    .getByRole("button", {
      name: `Plus d'actions pour « ${name} »`,
      exact: true,
    })
    .click();
  await page
    .getByRole("menu")
    .getByRole("menuitem", { name: `Supprimer « ${name} »`, exact: true })
    .click();
  await page
    .getByRole("alertdialog", { name: `Supprimer « ${name} » ?`, exact: true })
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(
    page.getByText(`« ${name} » supprimé`, { exact: true }),
  ).toBeVisible();
  // `main` is aria-hidden until the confirmation unmounts, so a role locator
  // under it matches nothing and `toBeHidden()` would pass on an empty match.
  await expect(
    page
      .locator("main")
      .getByRole("heading", { name, exact: true, includeHidden: true }),
  ).toHaveCount(0);
});
