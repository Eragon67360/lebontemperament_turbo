import assert from "node:assert/strict";
import { buildNavSections } from "./navigation";
import {
  buildTrail,
  groupSegmentFromPathname,
  memberIdFromPathname,
  programIdFromPathname,
  saleIdFromPathname,
} from "./trail";

const sections = buildNavSections({ isSuperAdmin: true });
const trail = (pathname: string, extra?: Parameters<typeof buildTrail>[0]) =>
  buildTrail({ pathname, sections, ...extra });

// Home is one word, not « Accueil › Accueil ».
assert.deepEqual(trail("/dashboard"), [{ label: "Accueil" }]);

// A nav page: its section (no page behind it, so no link) then the page.
assert.deepEqual(trail("/dashboard/public/concerts/prochains-concerts"), [
  { label: "Concerts et site public" },
  { label: "Concerts et tournées" },
]);

// A nav page inside a sub-group reads as its place in the tree (§ d.2), not as
// its URL ancestors: no « Vue d’ensemble » crumb, the group heading instead.
assert.deepEqual(trail("/dashboard/admin/anniversary/hero"), [
  { label: "Campagne 40 ans" },
  { label: "Contenu" },
  { label: "En-tête de la page" },
]);
assert.deepEqual(trail("/dashboard/admin/anniversary/memories"), [
  { label: "Campagne 40 ans" },
  { label: "Témoignages" },
  { label: "Modération" },
]);

// The campaign root is a page of its own and links from its children.
assert.deepEqual(trail("/dashboard/admin/anniversary"), [
  { label: "Campagne 40 ans" },
  { label: "Vue d’ensemble et publication" },
]);

// Preview: the `preview` segment has no page, the slug is humanised.
assert.deepEqual(
  trail("/dashboard/public/concerts/projets/preview/noel-2026"),
  [
    { label: "Concerts et site public" },
    {
      label: "Histoires de concerts",
      href: "/dashboard/public/concerts/projets",
    },
    { label: "Noel 2026" },
  ],
);

// Programme id swapped for its name once loaded, placeholder before.
const programPath = "/dashboard/members/travail/11111111-aaaa/choeur-complet";
assert.equal(programIdFromPathname(programPath), "11111111-aaaa");
assert.equal(programIdFromPathname("/dashboard/admin/users"), undefined);
assert.deepEqual(
  trail(programPath, {
    pathname: programPath,
    sections,
    programId: "11111111-aaaa",
    programName: "Saison 2026",
  }),
  [
    { label: "Saison des membres" },
    { label: "Partitions et documents", href: "/dashboard/members/travail" },
    { label: "Saison 2026", href: "/dashboard/members/travail/11111111-aaaa" },
    { label: "Choeur complet" },
  ],
);
assert.equal(
  trail(programPath, {
    pathname: programPath,
    sections,
    programId: "11111111-aaaa",
  })[2]?.label,
  "Programme…",
);

// Drive programmes: the group segment is a Drive folder ID, swapped for its name.
{
  const drivePath =
    "/dashboard/members/travail/19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd/1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB";
  assert.equal(
    groupSegmentFromPathname(drivePath),
    "1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB",
  );
  assert.equal(
    groupSegmentFromPathname("/dashboard/members/travail"),
    undefined,
  );
  assert.equal(
    groupSegmentFromPathname("/dashboard/admin/users/x/y"),
    undefined,
  );
  const input = {
    pathname: drivePath,
    sections,
    programId: "19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd",
    programName: "Requiem 2027",
    groupId: "1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB",
  };
  assert.deepEqual(trail(drivePath, { ...input, groupName: "Sopranes" }), [
    { label: "Saison des membres" },
    { label: "Partitions et documents", href: "/dashboard/members/travail" },
    {
      label: "Requiem 2027",
      href: "/dashboard/members/travail/19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd",
    },
    { label: "Sopranes" },
  ]);
  assert.equal(trail(drivePath, input)[3]?.label, "Groupe…");
  // The index has loaded and does not know the id: say so, like the page.
  const missing = trail(drivePath, {
    ...input,
    programName: null,
    groupName: null,
  });
  assert.equal(missing[2]?.label, "Programme introuvable");
  assert.equal(missing[3]?.label, "Groupe introuvable");
}

// A page outside the tree (the design-system lab) still says where it is.
assert.deepEqual(trail("/dashboard/design-system"), [
  { label: "Design system" },
]);

console.log("trail: ok");

// A member page: the id is swapped for the name, the list is a link back.
const memberPath =
  "/dashboard/admin/users/00000000-0000-4000-8000-000000000001";
assert.equal(
  memberIdFromPathname(memberPath),
  "00000000-0000-4000-8000-000000000001",
);
assert.equal(memberIdFromPathname("/dashboard/admin/users/sync"), undefined);
assert.equal(memberIdFromPathname("/dashboard/admin/users"), undefined);
const memberId = memberIdFromPathname(memberPath);
assert.deepEqual(
  trail(memberPath, {
    pathname: memberPath,
    sections,
    memberId,
    memberName: "Lucie BERNARD",
  }),
  [
    { label: "Membres et accès" },
    { label: "Membres", href: "/dashboard/admin/users" },
    { label: "Lucie BERNARD" },
  ],
);
assert.deepEqual(
  trail(memberPath, { pathname: memberPath, sections, memberId }).at(-1),
  { label: "Membre…" },
);
assert.deepEqual(
  trail(memberPath, {
    pathname: memberPath,
    sections,
    memberId,
    memberName: null,
  }).at(-1),
  { label: "Membre introuvable" },
);

// A sale page: « Association › Commandes › <title> », the id swapped for the
// title once loaded, a placeholder before, « Vente introuvable » when unknown.
const salePath = "/dashboard/admin/commandes/22222222-bbbb";
assert.equal(saleIdFromPathname(salePath), "22222222-bbbb");
assert.equal(saleIdFromPathname("/dashboard/admin/commandes"), undefined);
assert.equal(
  saleIdFromPathname("/dashboard/admin/users/22222222-bbbb"),
  undefined,
);
assert.deepEqual(trail("/dashboard/admin/commandes"), [
  { label: "Association" },
  { label: "Commandes" },
]);
assert.deepEqual(
  trail(salePath, {
    pathname: salePath,
    sections,
    saleId: "22222222-bbbb",
    saleTitle: "Fromages et saucissons · novembre 2026",
  }),
  [
    { label: "Association" },
    { label: "Commandes", href: "/dashboard/admin/commandes" },
    { label: "Fromages et saucissons · novembre 2026" },
  ],
);
assert.equal(
  trail(salePath, { pathname: salePath, sections, saleId: "22222222-bbbb" })[2]
    ?.label,
  "Vente…",
);
assert.equal(
  trail(salePath, {
    pathname: salePath,
    sections,
    saleId: "22222222-bbbb",
    saleTitle: null,
  })[2]?.label,
  "Vente introuvable",
);
