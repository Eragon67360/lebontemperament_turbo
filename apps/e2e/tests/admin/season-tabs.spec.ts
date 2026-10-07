import { expect, test } from "@playwright/test";

// P2 — read-only (#433, Phase 4 wave 4). « Répétitions » and « Événements »
// have « À venir / Passés » tabs; each tab lists its rows (with their edit and
// delete actions) or says there is nothing. Nothing is clicked except the
// tab, and every non-GET request is aborted anyway.
//
// Locators are scoped and exact on purpose: getByRole matches by substring,
// and direction B repeats an error message in the summary and under the field.

const SCREENS = [
  {
    path: "/dashboard/members/repetitions",
    title: "Répétitions",
    pastTab: "Passées",
    upcomingHeading: "Répétitions à venir",
    pastHeading: "Répétitions passées",
    emptyUpcoming: "Aucune répétition à venir",
    emptyPast: "Aucune répétition passée",
  },
  {
    path: "/dashboard/members/evenements",
    title: "Événements",
    pastTab: "Passés",
    upcomingHeading: "Événements à venir",
    pastHeading: "Événements passés",
    emptyUpcoming: "Aucun événement à venir",
    emptyPast: "Aucun événement passé",
  },
] as const;

for (const screen of SCREENS) {
  test(`${screen.title}: both tabs list rows or their empty state`, async ({
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
    await page.goto(screen.path);

    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { level: 1, name: screen.title, exact: true }),
    ).toBeVisible();

    const tabs = main.getByRole("tablist", { name: "Période", exact: true });
    await expect(
      tabs.getByRole("tab", { name: "À venir", exact: true }),
    ).toHaveAttribute("aria-selected", "true");

    const expectPanel = async (
      heading: string,
      empty: string,
    ): Promise<void> => {
      const panel = main.getByRole("tabpanel");
      await expect(
        panel.getByRole("heading", { level: 2, name: heading, exact: true }),
      ).toBeVisible();
      // The list has settled.
      await expect(panel.locator("[aria-busy='true']")).toHaveCount(0, {
        timeout: 30_000,
      });
      const region = panel.getByRole("region", { name: heading, exact: true });
      const rows = region.getByRole("button", { name: /^Modifier « / });
      if ((await rows.count()) > 0) {
        await expect(rows.first()).toBeVisible();
        await expect(
          region
            .getByRole("button", { name: /^Plus d'actions pour « / })
            .first(),
        ).toBeVisible();
      } else {
        await expect(
          region.getByRole("heading", { level: 2, name: empty, exact: true }),
        ).toBeVisible();
      }
    };

    await expectPanel(screen.upcomingHeading, screen.emptyUpcoming);
    await tabs.getByRole("tab", { name: screen.pastTab, exact: true }).click();
    await expectPanel(screen.pastHeading, screen.emptyPast);

    expect(writes).toEqual([]);
  });
}
