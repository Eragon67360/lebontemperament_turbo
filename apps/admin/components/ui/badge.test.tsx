// A Badge is a chip of text, so it renders a <span>. A <div> is block content:
// inside a <p>, a heading or a <button> (all of which only take text-level
// content) the HTML parser closes the element before it and React reports a
// hydration mismatch. The archived sale's header puts « Archivée » in the
// page's intro, which is a <p>. Static renders, no DOM.
import { PageShell } from "@/components/layouts/PageShell";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** The element names used in `html`, in order. */
const tagsOf = (html: string) =>
  [...html.matchAll(/<([a-z][a-z0-9]*)/g)].map((match) => match[1]);

/** The class list of the first element in `html`. */
const classesOf = (html: string) =>
  new Set((/class="([^"]*)"/.exec(html)?.[1] ?? "").split(/\s+/));

// --- A chip is one <span>; its props reach it ---
{
  const html = renderToStaticMarkup(
    <Badge variant="success" className="ml-2" title="Statut">
      Actif
    </Badge>,
  );
  assert.deepEqual(tagsOf(html), ["span"]);
  assert.match(html, /^<span [^>]*>Actif<\/span>$/);
  assert.match(html, /title="Statut"/);
  const classes = classesOf(html);
  for (const name of [
    "inline-flex",
    "rounded-full",
    "bg-success-soft",
    "ml-2",
  ]) {
    assert.ok(classes.has(name), `${name} is missing`);
  }
}

// --- The status dot is a <span> too, hidden from screen readers ---
{
  const html = renderToStaticMarkup(<Badge dot>Actif</Badge>);
  assert.deepEqual(tagsOf(html), ["span", "span"]);
  assert.match(html, /<span aria-hidden="[^"]*" class="size-2 [^"]*"><\/span>/);
}

// --- A status is a chip as well ---
{
  const html = renderToStaticMarkup(
    <StatusBadge tone="warning">À régler</StatusBadge>,
  );
  assert.deepEqual(tagsOf(html), ["span", "span"]);
  assert.match(html, /À régler<\/span>$/);
}

// --- Where a chip sits: only text-level elements around it ---
for (const container of ["p", "h2", "h3", "button"]) {
  const html = renderToStaticMarkup(
    createElement(container, null, createElement(Badge, null, "Actif")),
  );
  assert.deepEqual(tagsOf(html), [container, "span"], container);
}

// --- An archived sale's header: « Archivée » sits in the intro paragraph ---
{
  // The intro of `app/dashboard/admin/commandes/[saleId]/page.tsx`, with a
  // made-up sale.
  const html = renderToStaticMarkup(
    <PageShell
      title="Vente de printemps"
      description={
        <span className="flex flex-wrap items-center gap-2">
          Du 1er au 15 mars
          <StatusBadge tone="neutral" dot={false}>
            Archivée
          </StatusBadge>
        </span>
      }
    >
      <p>Commandes</p>
    </PageShell>,
  );
  const intro = /<p class="text-muted-foreground[^"]*">(.*?)<\/p>/.exec(
    html,
  )?.[1];
  assert.ok(intro, "the intro paragraph is rendered");
  // Nothing but spans inside the paragraph: no block element closes it early.
  assert.deepEqual(tagsOf(intro), ["span", "span"]);
  assert.match(intro, /Du 1er au 15 mars/);
  assert.match(intro, /Archivée<\/span><\/span>$/);
}

console.log("badge: a chip is a span, valid inside a paragraph");
