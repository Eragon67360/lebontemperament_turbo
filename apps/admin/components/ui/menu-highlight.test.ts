// A highlighted menu item used to take `bg-accent`, which is the popover
// colour itself in dark mode (1.00:1, measured for the 2026-10-26 audit) and
// barely differs from it in light mode (1.13:1): arrowing through a row menu,
// a Select or the ⌘K palette showed no position at all. Every list drawn on
// a popover highlights its item with the soft teal tint and the teal left
// mark of a selected table row instead (the mark is 4.3:1 and 5.0:1 on the
// popover). This keeps the accent tint out of those primitives, and the mark
// on the highlighted item.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const POPOVER_LISTS = ["dropdown-menu.tsx", "select.tsx", "command.tsx"];
const ACCENT_CLASS = /[\s"'`:](?:bg|text)-accent\b/;
const LEFT_MARK = /data-\[(?:highlighted|selected=true)\]:shadow-\[inset_3px_0_0_var\(--primary\)\]/;

for (const file of POPOVER_LISTS) {
  const source = readFileSync(
    fileURLToPath(new URL(file, import.meta.url)),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    ACCENT_CLASS,
    `${file}: the accent tint is invisible on a popover in dark mode; highlight with primary-soft`,
  );
  assert.match(
    source,
    LEFT_MARK,
    `${file}: the highlighted item carries the teal left mark (3:1 on the popover in both themes)`,
  );
}

console.log("menu highlight: ok");
