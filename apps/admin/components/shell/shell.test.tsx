// Static renders of the sidebar (no DOM): which section shows its
// description, which one is teal, and the brand mark.
import { buildNavSections } from "@/lib/navigation";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandMark } from "./BrandMark";
import { SectionRowContent, SidebarNav } from "./SidebarNav";

const sections = buildNavSections({ isSuperAdmin: true });
const descriptions = sections.map((section) => section.description);

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

// --- One description at a time: the open section's, in full ---
{
  const html = renderNav("/dashboard/admin/anniversary/hero");
  const campaign = sections.find((section) => section.id === "campaign")!;
  assert.equal(visibleCount(html, campaign.description), 1);
  for (const section of sections) {
    if (section.id === "campaign") continue;
    assert.equal(
      visibleCount(html, section.description),
      0,
      `${section.label}'s description is shown although the section is closed`,
    );
    // …but it stays the row's tooltip and accessible description.
    assert.ok(
      html.includes(`title="${section.description}"`),
      `${section.label} lost its description tooltip`,
    );
  }
  assert.doesNotMatch(html, /line-clamp|truncate[^"]*">Préparer/);
  // 13 px `text-note` survives next to the colour (tailwind-merge drops it in cn()).
  assert.match(
    html,
    new RegExp(
      `class="text-note block text-muted-foreground">${campaign.description}<`,
    ),
  );
}

// --- Accueil is the current page on /dashboard: its row and description are teal ---
{
  const html = renderNav("/dashboard");
  const home = sections[0]!;
  assert.match(html, new RegExp(`text-primary-text">${home.description}<`));
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
}

// --- Outside the menu (both hrefs undefined) nothing is current or teal ---
// Before the fix, `section.href === activeHref` was true for every
// collapsible section here and painted their descriptions teal.
{
  const html = renderNav("/hors-du-menu");
  assert.doesNotMatch(html, /aria-current/);
  assert.doesNotMatch(html, /text-primary-text/);
  for (const description of descriptions) {
    assert.equal(visibleCount(html, description), 0);
  }
}

// --- SectionRowContent itself: teal only when current ---
{
  const campaign = sections[1]!;
  const open = renderToStaticMarkup(
    <SectionRowContent section={campaign} showDescription isCurrent={false} />,
  );
  assert.match(open, /text-muted-foreground">Préparer et publier/);
  const closed = renderToStaticMarkup(
    <SectionRowContent
      section={campaign}
      showDescription={false}
      isCurrent={false}
    />,
  );
  assert.doesNotMatch(closed, /Préparer et publier/);
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
