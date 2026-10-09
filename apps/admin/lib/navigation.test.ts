import assert from "node:assert/strict";
import {
  activeNavHref,
  buildNavSections,
  flattenNavItems,
  isSectionCurrent,
  navLabelForHref,
  navSectionForHref,
} from "./navigation";

// Every destination of the pre-redesign sidebar (22 routes, Messages was a
// dialog) must keep an entry in the new tree: nothing orphaned (inventory § d.2).
const OLD_NAV_HREFS = [
  "/dashboard",
  "/dashboard/public/concerts/prochains-concerts",
  "/dashboard/public/concerts/projets",
  "/dashboard/public/gallery/videos",
  "/dashboard/members/repetitions",
  "/dashboard/members/evenements",
  "/dashboard/members/travail",
  "/dashboard/admin/users",
  "/dashboard/admin/google-groups",
  "/dashboard/admin/ca",
  "/dashboard/admin/bug-reports",
  "/dashboard/admin/anniversary",
  "/dashboard/admin/anniversary/hero",
  "/dashboard/admin/anniversary/hero-stats",
  "/dashboard/admin/anniversary/navigation",
  "/dashboard/admin/anniversary/timeline",
  "/dashboard/admin/anniversary/videos",
  "/dashboard/admin/anniversary/audio",
  "/dashboard/admin/anniversary/photos",
  "/dashboard/admin/anniversary/archives",
  "/dashboard/admin/anniversary/form",
  "/dashboard/admin/anniversary/memories",
];
assert.equal(OLD_NAV_HREFS.length, 22);

const superadmin = buildNavSections({ isSuperAdmin: true });
const admin = buildNavSections();
const hrefs = flattenNavItems(superadmin).map((item) => item.href);

for (const href of OLD_NAV_HREFS) {
  assert.ok(hrefs.includes(href), `${href} has no nav entry any more`);
}
// Added since: « Documents de l'association » (2026-10-08).
const NEW_NAV_HREFS = [
  "/dashboard/admin/documents",
  "/dashboard/admin/assemblies",
  "/dashboard/public/annonces",
  "/dashboard/public/rejoindre-faq",
];
for (const href of NEW_NAV_HREFS) {
  assert.ok(hrefs.includes(href), `${href} has no nav entry`);
}
assert.equal(
  hrefs.length,
  OLD_NAV_HREFS.length + NEW_NAV_HREFS.length,
  "no unknown route was added to the nav",
);
assert.equal(new Set(hrefs).size, hrefs.length, "each route appears once");

// The six sections of the approved IA, in order, each with a description.
assert.deepEqual(
  admin.map((section) => section.label),
  [
    "Accueil",
    "Campagne 40 ans",
    "Concerts et site public",
    "Saison des membres",
    "Membres et accès",
    "Association",
  ],
);
for (const section of admin) {
  assert.ok(section.description.length > 0, `${section.label} needs a line`);
  assert.ok(
    section.href || section.groups.some((group) => group.items.length > 0),
    `${section.label} leads nowhere`,
  );
}
// Campaign sub-groups.
assert.deepEqual(
  admin[1]?.groups.map((group) => group.label),
  [undefined, "Contenu", "Témoignages"],
);

// Signalements is superadmin-only, with its attention dot when unread.
assert.equal(navLabelForHref(admin, "/dashboard/admin/bug-reports"), undefined);
assert.equal(
  navLabelForHref(superadmin, "/dashboard/admin/bug-reports"),
  "Signalements",
);
assert.equal(
  flattenNavItems(
    buildNavSections({ isSuperAdmin: true, unreadBugReports: 2 }),
  ).find((item) => item.href === "/dashboard/admin/bug-reports")?.badge,
  "dot",
);
assert.equal(
  flattenNavItems(superadmin).find(
    (item) => item.href === "/dashboard/admin/bug-reports",
  )?.badge,
  undefined,
);

// Longest matching ancestor wins; the root never swallows nested routes.
assert.equal(
  activeNavHref(admin, "/dashboard/admin/anniversary/hero"),
  "/dashboard/admin/anniversary/hero",
);
assert.equal(
  activeNavHref(admin, "/dashboard/admin/anniversary/hero/anything"),
  "/dashboard/admin/anniversary/hero",
);
assert.equal(
  activeNavHref(admin, "/dashboard/members/travail/abc/def"),
  "/dashboard/members/travail",
);
assert.equal(activeNavHref(admin, "/dashboard"), "/dashboard");
assert.equal(activeNavHref(admin, "/dashboard/design-system"), "/dashboard");
assert.equal(
  activeNavHref(admin, "/dashboard/public/concerts/projets/preview/x"),
  "/dashboard/public/concerts/projets",
);

// A section owns its items; Accueil owns itself.
assert.equal(
  navSectionForHref(admin, "/dashboard/admin/anniversary/photos")?.id,
  "campaign",
);
assert.equal(navSectionForHref(admin, "/dashboard")?.id, "home");
assert.equal(navSectionForHref(admin, undefined), undefined);

// Only a section that is a page can be current. On a route outside the menu
// both hrefs are undefined: that must not mark every collapsible section.
assert.equal(isSectionCurrent({ href: undefined }, undefined), false);
assert.equal(isSectionCurrent({ href: "/dashboard" }, undefined), false);
assert.equal(isSectionCurrent({ href: "/dashboard" }, "/dashboard"), true);
assert.equal(
  isSectionCurrent({ href: undefined }, "/dashboard/admin/users"),
  false,
);
assert.deepEqual(
  admin
    .filter((section) =>
      isSectionCurrent(section, activeNavHref(admin, "/hors-du-menu")),
    )
    .map((section) => section.id),
  [],
);

console.log("navigation: ok");
