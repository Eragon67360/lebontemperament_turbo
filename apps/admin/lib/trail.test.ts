import assert from "node:assert/strict";
import { buildNavSections } from "./navigation";
import { buildTrail, programIdFromPathname } from "./trail";

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

// A page outside the tree (the design-system lab) still says where it is.
assert.deepEqual(trail("/dashboard/design-system"), [
  { label: "Design system" },
]);

console.log("trail: ok");
