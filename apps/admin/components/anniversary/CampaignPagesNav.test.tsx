// The campaign's own menu: its eleven pages, grouped, the current one marked.
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CampaignPagesNav } from "./CampaignPagesNav";

function render(pathname: string) {
  return renderToStaticMarkup(
    <PathnameContext.Provider value={pathname}>
      <CampaignPagesNav />
    </PathnameContext.Provider>,
  );
}

{
  const html = render("/dashboard/admin/anniversary/timeline");
  assert.match(html, /aria-label="Pages de la campagne"/);
  assert.equal((html.match(/<a /g) ?? []).length, 11);
  assert.match(html, />Contenu</);
  assert.match(html, />Témoignages</);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*>Chronologie</);
  // 14 px type survives next to the colour (tailwind-merge drops it in cn()).
  assert.match(html, /class="text-detail /);
}

{
  const html = render("/dashboard/admin/anniversary");
  assert.match(html, /aria-current="page"[^>]*>Vue d’ensemble et publication</);
}

console.log("campaign pages nav: ok");
