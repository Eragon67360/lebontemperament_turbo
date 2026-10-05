import { expect, test } from "@playwright/test";

// P2 — read-only (#480, F4). « Concerts et tournées » has « À venir / Passés »
// tabs; « Passés » lists the past concerts (most recent first, with their
// edit and delete actions) or says there are none. Nothing is clicked except
// the tab, and every non-GET request is aborted anyway.
test("the « Passés » tab lists past concerts or its empty state", async ({
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
  await page.goto("/dashboard/public/concerts/prochains-concerts");

  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", {
      level: 1,
      name: "Concerts et tournées",
      exact: true,
    }),
  ).toBeVisible();

  const tabs = main.getByRole("tablist", { name: "Période", exact: true });
  await expect(
    tabs.getByRole("tab", { name: "À venir", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await tabs.getByRole("tab", { name: "Passés", exact: true }).click();

  const panel = main.getByRole("tabpanel");
  await expect(
    panel.getByRole("heading", {
      level: 2,
      name: "Concerts passés",
      exact: true,
    }),
  ).toBeVisible();
  // Lists have settled.
  await expect(panel.locator("[aria-busy='true']")).toHaveCount(0, {
    timeout: 30_000,
  });

  // The concerts section only: tour rows carry the same actions.
  const concerts = panel.getByRole("region", {
    name: "Concerts passés",
    exact: true,
  });
  const rows = concerts.getByRole("button", { name: /^Modifier « / });
  const empty = concerts.getByRole("heading", {
    level: 2,
    name: "Aucun concert passé",
    exact: true,
  });
  const count = await rows.count();
  if (count > 0) {
    // Past concerts are correctable: each row has « Modifier » and « Supprimer ».
    await expect(rows.first()).toBeVisible();
    await expect(
      concerts.getByRole("button", { name: /^Supprimer « / }).first(),
    ).toBeVisible();
  } else {
    await expect(empty).toBeVisible();
  }

  expect(writes).toEqual([]);
});
