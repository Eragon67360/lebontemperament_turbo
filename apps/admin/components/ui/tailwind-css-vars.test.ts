// Tailwind v4 reads `max-h-[--x]` as the literal value `--x`, which is not
// valid CSS, so the browser drops the rule. That left the Select list with
// no height cap: in « Ajouter une commande », « Vendu par » ran off the
// screen and could not be scrolled. A CSS variable is written `max-h-(--x)`
// (or `max-h-[var(--x)]`). This scans the admin's sources for the v3 form.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const SKIP = new Set(["node_modules", ".next", ".turbo"]);
const V3_VAR = /[\w-]+-\[--[\w-]+\]/g;

function walk(dir: string, out: string[]): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
      out.push(path);
  }
  return out;
}

const offenders = ["components", "app"]
  .flatMap((dir) => walk(join(root, dir), []))
  .flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(V3_VAR)].map(
      (match) => `${relative(root, file)}: ${match[0]}`,
    ),
  );

assert.deepEqual(offenders, [], "use `utility-(--var)` for CSS variables");

console.log("tailwind-css-vars: ok");
