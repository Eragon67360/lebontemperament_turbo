// DataState's states as a reader sees them (static render, no DOM):
// loading, empty, error without data, error with data, loaded. A failed
// refresh of a list that is already on screen keeps the list and adds a
// polite « Actualisation impossible » notice; the error card is for when
// nothing is loaded.
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DataState, EmptyState, ListSkeleton } from "./data-state";

const rows = (
  <ul>
    <li>Prénom NOM</li>
    <li>Camille DUPONT</li>
  </ul>
);

type Props = Omit<Parameters<typeof DataState>[0], "children">;

function render(props: Partial<Props>) {
  return renderToStaticMarkup(
    <DataState
      onRetry={() => {}}
      errorDescription="Les lignes n'ont pas pu être chargées."
      skeleton={<ListSkeleton rows={2} label="Chargement des lignes…" />}
      empty={<EmptyState title="Aucune ligne" />}
      {...props}
    >
      {rows}
    </DataState>,
  );
}

// --- Loading: the skeleton, announced as busy, nothing else ---
{
  const html = render({ isLoading: true });
  assert.match(html, /aria-busy/);
  assert.match(html, /Chargement des lignes…/);
  assert.doesNotMatch(html, /Camille DUPONT/);
  assert.doesNotMatch(html, /role="alert"/);
  assert.doesNotMatch(html, /Actualisation impossible/);
}

// --- Empty: the empty state, no rows, no notice ---
{
  const html = render({ isEmpty: true });
  assert.match(html, /Aucune ligne/);
  assert.doesNotMatch(html, /Camille DUPONT/);
  assert.doesNotMatch(html, /role="alert"/);
  assert.doesNotMatch(html, /Actualisation impossible/);
}

// --- Error with nothing loaded: the error card with retry (unchanged) ---
{
  const html = render({ isError: true });
  assert.match(html, /role="alert"/);
  assert.match(html, /Le chargement a échoué/);
  assert.match(html, /Les lignes n(&#x27;|')ont pas pu être chargées\./);
  assert.match(html, /<button[^>]*>.*Réessayer/);
  assert.doesNotMatch(html, /Camille DUPONT/);
  assert.doesNotMatch(html, /Actualisation impossible/);
  // Also when the page says the list is empty but the load failed.
  assert.match(render({ isError: true, isEmpty: true }), /role="alert"/);
  // The default: a caller that does not say whether data exists keeps the card.
  assert.match(render({ isError: true, hasData: false }), /role="alert"/);
}

// --- Error with data on screen: the rows stay, a polite notice says why ---
{
  const html = render({ isError: true, hasData: true });
  assert.match(html, /Prénom NOM/);
  assert.match(html, /Camille DUPONT/);
  assert.match(html, /Actualisation impossible/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /role="alert"/);
  assert.doesNotMatch(html, /Le chargement a échoué/);
  assert.match(html, /<button[^>]*>.*Réessayer/);
  // The notice comes before the rows, so it is seen without scrolling.
  assert.ok(
    html.indexOf("Actualisation impossible") < html.indexOf("Prénom NOM"),
  );
  // Without a retry handler, no button; the sentence still explains.
  const noRetry = render({ isError: true, hasData: true, onRetry: undefined });
  assert.match(noRetry, /Actualisation impossible/);
  assert.doesNotMatch(noRetry, /Réessayer/);
  // An empty list that was loaded keeps its empty state, with the notice.
  const empty = render({ isError: true, hasData: true, isEmpty: true });
  assert.match(empty, /Aucune ligne/);
  assert.match(empty, /Actualisation impossible/);
  assert.doesNotMatch(empty, /role="alert"/);
}

// --- Loaded: the rows, nothing else ---
{
  const html = render({});
  assert.match(html, /Camille DUPONT/);
  assert.doesNotMatch(html, /role="alert"/);
  assert.doesNotMatch(html, /role="status"/);
  assert.doesNotMatch(html, /Actualisation impossible/);
  assert.doesNotMatch(html, /Réessayer/);
  // Data present and fresh: the prop changes nothing.
  assert.equal(render({ hasData: true }), html);
}

console.log("data state: all assertions passed");
