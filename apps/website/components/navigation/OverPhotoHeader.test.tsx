// Run with: npx tsx --tsconfig tsconfig.test.json components/navigation/OverPhotoHeader.test.tsx
//
// The over-photo header is an opt-in by the mounted hero, which only the
// browser knows (audit UI-V-001 and UI-V-002): the server render is the solid
// header on every page, photo or not, so the hydrating render matches it and
// the page switches at hydration. The one exception is a page whose photo is
// certain (the home): the provider's `assumeOverPhoto` makes its server HTML
// start over the photo, and the browser drops the assumption once hydrated.
import assert from "node:assert/strict";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import {
  OverPhotoHeaderProvider,
  useOverPhotoHeader,
  useOverPhotoHero,
} from "./OverPhotoHeader";

function Header() {
  return <nav data-over-photo={useOverPhotoHeader() ? "yes" : "no"}>menu</nav>;
}

function Hero({ hasPhoto }: { hasPhoto: boolean }) {
  useOverPhotoHero(hasPhoto);
  return <section>hero</section>;
}

/** The site shell: the header above the page, inside the provider. */
const render = (assumeOverPhoto: boolean | undefined, hero?: ReactNode) =>
  renderToString(
    <OverPhotoHeaderProvider assumeOverPhoto={assumeOverPhoto}>
      <Header />
      <main>{hero}</main>
    </OverPhotoHeaderProvider>,
  );

// No assumption: a photo hero in the tree still leaves the server HTML on the
// solid header (a story with a banner switches at hydration).
assert.match(render(undefined, <Hero hasPhoto />), /data-over-photo="no"/);

// No photo: solid as well.
assert.match(
  render(undefined, <Hero hasPhoto={false} />),
  /data-over-photo="no"/,
);

// The home: the server render assumes the photo, so the HTML already carries
// the white header (the hero confirms it in the browser).
assert.match(render(true, <Hero hasPhoto />), /data-over-photo="yes"/);

// The assumption alone decides the server HTML; the browser corrects it after
// hydration when no hero registers (an error boundary at "/").
assert.match(render(true), /data-over-photo="yes"/);
assert.match(render(false), /data-over-photo="no"/);

// Pages that render no site header have no provider: the hooks are inert.
assert.match(
  renderToString(
    <div>
      <Header />
      <Hero hasPhoto />
    </div>,
  ),
  /data-over-photo="no"/,
);

console.log("OverPhotoHeader.test.tsx: ok");
