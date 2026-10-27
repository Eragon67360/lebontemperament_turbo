// Run with: npx tsx components/providers/MotionProvider.test.ts
import { MotionConfigContext } from "motion/react";
import assert from "node:assert/strict";
import * as React from "react";
import { createElement, useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MotionProvider } from "./MotionProvider";

// tsx compiles the provider's JSX with the classic runtime (the app's tsconfig
// says "preserve", Next does the real compile): give it the React it expects.
Object.assign(globalThis, { React });

// What every Motion component reads to decide whether to skip its transform
// and layout animations.
function ReducedMotionSetting() {
  const { reducedMotion } = useContext(MotionConfigContext);
  return createElement("span", null, reducedMotion);
}

// Motion's default ignores the visitor's preference ("never"); the site's
// provider follows prefers-reduced-motion ("user").
assert.equal(
  renderToStaticMarkup(createElement(ReducedMotionSetting)),
  "<span>never</span>",
);
assert.equal(
  renderToStaticMarkup(
    createElement(MotionProvider, null, createElement(ReducedMotionSetting)),
  ),
  "<span>user</span>",
);

console.log("MotionProvider: reduced motion follows the visitor's setting");
