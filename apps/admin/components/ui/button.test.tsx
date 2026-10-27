// The small icon button is 40 px with a mouse and 44 px on touch screens, like
// `sm` (rule 7 of the admin screens: 44 px targets on touch). It carries the
// « Monter », « Descendre », « Retirer » and « Supprimer le paiement » buttons.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, buttonVariants } from "./button";

const classesOf = (size: "sm" | "icon-sm") =>
  buttonVariants({ size }).split(/\s+/);

// Both small sizes follow the same rule: 40 px, 44 px on a coarse pointer.
assert.ok(classesOf("sm").includes("pointer-coarse:h-11"));
assert.ok(classesOf("icon-sm").includes("size-10"));
assert.ok(classesOf("icon-sm").includes("pointer-coarse:size-11"));

// The rendered button carries both classes.
const html = renderToStaticMarkup(
  createElement(Button, { size: "icon-sm", "aria-label": "Monter" }),
);
const rendered = (/class="([^"]*)"/.exec(html)?.[1] ?? "").split(/\s+/);
assert.ok(rendered.includes("size-10"), "40 px with a mouse");
assert.ok(rendered.includes("pointer-coarse:size-11"), "44 px on touch");

console.log("button: icon-sm grows to 44 px on touch");
