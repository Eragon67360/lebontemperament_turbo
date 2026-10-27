// Run with: npx tsx lib/deadClasses.test.ts
//
// HeroUI v2 token names (`bg-content1`, `border-default-200`,
// `text-muted-foreground`…) generate no CSS since the HeroUI 3 migration: an
// element styled with them has no background, or falls back to the default
// border colour in both themes. This scan keeps them out of the website's
// sources. The HeroUI 3 names are `bg-surface` / `bg-overlay`,
// `border-separator` and `text-muted` (the site's own tokens: app/globals.css).
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const folders = ["app", "components", "hooks", "lib", "utils"];

// A colour utility on a v2 token name, with any variant prefix and opacity.
const V2_TOKEN =
  /(?:^|[^\w-])((?:[\w-]+:)*(?:bg|text|border(?:-[trblxy])?|ring|divide|outline|from|to|via|fill|stroke|shadow)-(?:content[1-4]|default-\d{2,3}|muted-foreground)(?:\/\d+)?)(?![\w-])/g;

// Call sites another change replaces; drop an entry once it is gone.
const KNOWN_LEFTOVERS: Record<string, string[]> = {
  "components/GoogleCalendar.tsx": ["bg-content1"],
};

// The pattern itself, so a broken regex cannot pass the scan silently.
assert.deepEqual(
  [
    ...'className="border-default-200 bg-content1 dark:text-muted-foreground/50 bg-surface border-separator text-muted bg-default"'.matchAll(
      V2_TOKEN,
    ),
  ].map((match) => match[1]),
  ["border-default-200", "bg-content1", "dark:text-muted-foreground/50"],
);

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        yield* sourceFiles(file);
      }
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")) {
      yield file;
    }
  }
}

const findings: string[] = [];
for (const folder of folders) {
  const dir = path.join(root, folder);
  if (!existsSync(dir)) continue;
  for (const file of sourceFiles(dir)) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    const allowed = KNOWN_LEFTOVERS[relative] ?? [];
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        for (const match of line.matchAll(V2_TOKEN)) {
          const className = match[1];
          if (!className) continue;
          const bare = className
            .replace(/^(?:[\w-]+:)*/, "")
            .replace(/\/\d+$/, "");
          if (allowed.includes(bare)) continue;
          findings.push(`${relative}:${index + 1} ${className}`);
        }
      });
  }
}

assert.deepEqual(
  findings,
  [],
  `HeroUI v2 class names generate no CSS on the website; use the HeroUI 3 tokens instead:\n${findings.join("\n")}`,
);

console.log("deadClasses: no HeroUI v2 class names in the website sources");
