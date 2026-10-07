// Static renders of the sidebar (no DOM): every page visible under its
// section's title, one current entry, the campaign as one project entry, and
// the brand mark.
import { buildNavSections, flattenNavItems } from "@/lib/navigation";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandMark } from "./BrandMark";
import { SidebarNav } from "./SidebarNav";

const sections = buildNavSections({ isSuperAdmin: true });
const campaign = sections.find((section) => section.id === "campaign")!;
const campaignHrefs = new Set(
  campaign.groups.flatMap((group) => group.items.map((item) => item.href)),
);

/** The sidebar as the shell renders it on `pathname` (usePathname reads this context). */
function renderNav(pathname: string) {
  return renderToStaticMarkup(
    <PathnameContext.Provider value={pathname}>
      <SidebarNav sections={sections} />
    </PathnameContext.Provider>,
  );
}

/** How many times `text` is rendered as visible text (not inside an attribute). */
function visibleCount(html: string, text: string) {
  return html.split(`>${text}<`).length - 1;
}

// --- Flat: every page outside the campaign is visible, nothing folds ---
{
  const html = renderNav("/dashboard");
  for (const item of flattenNavItems(sections)) {
    if (campaignHrefs.has(item.href)) continue;
    assert.ok(html.includes(`href="${item.href}"`), `${item.label} is hidden`);
  }
  assert.doesNotMatch(html, /aria-expanded|<button/);
  // Section titles name their lists; descriptions stay on the home page.
  for (const section of sections) {
    if (section.href || section.kind === "project") continue;
    assert.equal(visibleCount(html, section.label), 1);
    assert.ok(html.includes(`aria-labelledby="nav-title-${section.id}"`));
  }
  for (const section of sections) {
    assert.equal(visibleCount(html, section.description), 0);
  }
  assert.equal(visibleCount(html, "Projets"), 1);
}

// --- Accueil is the current page on /dashboard, and the only one ---
{
  const html = renderNav("/dashboard");
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*>.*?Accueil</);
}

// --- A campaign page lights up the one « Campagne 40 ans » entry ---
{
  const html = renderNav("/dashboard/admin/anniversary/hero");
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*>.*?Campagne 40 ans</);
  // Its eleven pages are not in the sidebar (they have their own menu).
  assert.equal(visibleCount(html, "Chronologie"), 0);
  assert.equal(visibleCount(html, "En-tête de la page"), 0);
}

// --- A nested route lights up its closest entry ---
{
  const html = renderNav("/dashboard/admin/users/some-id");
  assert.match(html, /aria-current="page"[^>]*>.*?Membres</);
}

// --- Outside the menu nothing is current or teal ---
{
  const html = renderNav("/hors-du-menu");
  assert.doesNotMatch(html, /aria-current/);
  assert.doesNotMatch(html, /text-primary-text/);
}

// --- Brand mark: decorative, token colours, the tuning fork ---
{
  const html = renderToStaticMarkup(<BrandMark />);
  assert.match(html, /^<span aria-hidden="true"/);
  assert.match(html, /bg-primary-strong/);
  assert.match(html, /text-primary-foreground/);
  assert.match(html, /d="M9 3v7a3 3 0 0 0 6 0V3"/);
  assert.match(html, /d="M12 13v8"/);
  assert.doesNotMatch(html, /#[0-9a-f]{3,6}\b/i, "no raw colour in the mark");
}

console.log("shell: ok");
