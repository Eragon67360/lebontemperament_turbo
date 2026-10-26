// Run with: npx tsx components/navigation/OverPhotoHeader.test.ts
//
// The over-photo header is an opt-in by the mounted hero, never a property
// of the server HTML (audit UI-V-001 and UI-V-002): the server render is the
// solid header on every page, photo or not, so the hydrating render matches
// it and the page switches only after mount.
import assert from "node:assert/strict";
import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import {
  OverPhotoHeaderProvider,
  useOverPhotoHeader,
  useOverPhotoHero,
} from "./OverPhotoHeader";

function Header() {
  return createElement(
    "nav",
    { "data-over-photo": useOverPhotoHeader() ? "yes" : "no" },
    "menu",
  );
}

function Hero({ hasPhoto }: { hasPhoto: boolean }) {
  useOverPhotoHero(hasPhoto);
  return createElement("section", null, "hero");
}

function Shell({ children }: { children: ReactNode }) {
  return createElement(
    OverPhotoHeaderProvider,
    null,
    createElement(Header),
    createElement("main", null, children),
  );
}

// A photo hero in the tree: the server HTML still carries the solid header.
{
  const html = renderToString(
    createElement(Shell, null, createElement(Hero, { hasPhoto: true })),
  );
  assert.match(html, /data-over-photo="no"/);
}

// No photo: solid as well.
{
  const html = renderToString(
    createElement(Shell, null, createElement(Hero, { hasPhoto: false })),
  );
  assert.match(html, /data-over-photo="no"/);
}

// Pages that render no site header have no provider: the hooks are inert.
{
  const html = renderToString(
    createElement(
      "div",
      null,
      createElement(Header),
      createElement(Hero, { hasPhoto: true }),
    ),
  );
  assert.match(html, /data-over-photo="no"/);
}

console.log("OverPhotoHeader.test.ts: ok");
