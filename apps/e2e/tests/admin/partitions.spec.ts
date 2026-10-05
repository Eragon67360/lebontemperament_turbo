import { expect, test } from "@playwright/test";

// P2 — read-only (#433, F3 part 2). « Partitions et documents » reads the
// Drive index: « Synchroniser depuis Drive » is the one primary (never
// clicked here), then the programmes by Drive space or the empty state. When
// a programme exists, its page lists its groups. Only links are followed,
// and every non-GET request is aborted anyway.
test("« Partitions et documents » lists the Drive programmes", async ({
  page,
}) => {
  const writes: string[] = [];
  await page.route("**/*", (route) => {
    const request = route.request();
    if (request.method() === "GET" || request.method() === "HEAD") {
      return route.continue();
    }
    writes.push(`${request.method()} ${request.url()}`);
    return route.abort();
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/dashboard/members/travail");

  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", {
      level: 1,
      name: "Partitions et documents",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    main.getByRole("button", {
      name: "Synchroniser depuis Drive",
      exact: true,
    }),
  ).toBeEnabled();

  const sync = main.getByRole("region", {
    name: "Synchronisation avec Drive",
    exact: true,
  });
  await expect(sync).toBeVisible();

  const programmes = main.getByRole("region", {
    name: "Programmes",
    exact: true,
  });
  await expect(programmes.locator("[aria-busy='true']")).toHaveCount(0, {
    timeout: 30_000,
  });
  await expect(programmes.getByRole("alert")).toHaveCount(0);

  const links = programmes.locator('a[href^="/dashboard/members/travail/"]');
  const count = await links.count();
  if (count === 0) {
    await expect(
      programmes.getByRole("heading", {
        level: 2,
        name: "L'index Drive est vide",
        exact: true,
      }),
    ).toBeVisible();
  } else {
    const first = links.first();
    const name = (await first.innerText()).trim();
    await first.click();
    await expect(
      main.getByRole("heading", { level: 1, name, exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    const groups = main.getByRole("region", { name: "Groupes", exact: true });
    await expect(groups).toBeVisible();

    // When the programme has a group, its page lists the documents folder by
    // folder (a labelled list), or says there are none yet.
    const groupLinks = groups.locator('a[href^="/dashboard/members/travail/"]');
    if ((await groupLinks.count()) > 0) {
      const firstGroup = groupLinks.first();
      const groupName = (await firstGroup.innerText()).trim();
      await firstGroup.click();
      await expect(
        main.getByRole("heading", { level: 1, name: groupName, exact: true }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(
        main
          .getByRole("list")
          .or(
            main.getByRole("heading", {
              level: 2,
              name: "Aucun document",
              exact: true,
            }),
          )
          .first(),
      ).toBeVisible();
      await page.goBack();
    }
    await page.goBack();
  }

  // The old Storage explorer stays reachable, collapsed at the bottom.
  await expect(
    main.getByText("Anciens fichiers (stockage)", { exact: true }),
  ).toBeVisible();

  expect(writes).toEqual([]);
});
