import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Dark mode follows the device since Phase 5 (P6), so every screen must use
// the design tokens: a palette colour or a hex in a class name shows as a
// light patch in dark mode. A black scrim with a white icon over a photo is
// the one allowed exception (it reads the same in both themes).
const root = fileURLToPath(new URL("..", import.meta.url));
const PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|divide|outline|from|to|via|placeholder)-(?:white|black|gray|slate|zinc|neutral|stone|red|green|blue|yellow|amber|orange|emerald|teal|cyan|sky|indigo|violet|purple|pink|rose|lime|fuchsia)(?:-\d{2,3})?\b|\[#[0-9a-f]{3,8}\]/gi;
const SCRIM = /^(?:bg-black\/\d+|hover:bg-black\/\d+|text-white)$/;

function* sources(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sources(path);
    else if (/\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name))
      yield path;
  }
}

const offenders: string[] = [];
for (const dir of ["app", "components"]) {
  for (const file of sources(join(root, dir))) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const match of line.matchAll(PALETTE)) {
        // The whole class around the match, variants and opacity included.
        const start = line.slice(0, match.index).search(/[^\s"'`]*$/);
        const token = line.slice(start).split(/[\s"'`]/)[0] ?? "";
        if (SCRIM.test(token)) continue;
        offenders.push(`${relative(root, file)}:${index + 1} ${match[0]}`);
      }
    });
  }
}

assert.deepEqual(offenders, [], "tokens only, so dark mode stays readable");

console.log("theme tokens: ok");
