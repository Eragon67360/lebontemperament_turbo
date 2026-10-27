// A placeholder is text: WCAG AA wants 4.5:1 against the surface it sits on.
// `text-foreground-faint` is the token for icons and decoration (3.05:1 on a
// white card), so a placeholder must use a token that reaches 4.5:1 on every
// surface a field can sit on, in both themes. This reads the tokens from
// `app/globals.css` and every placeholder colour class in the admin's sources,
// and checks that the four primitives (Input, Textarea, Select, ⌘K input) all
// declare one.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const SKIP = new Set(["node_modules", ".next", ".turbo"]);
const AA_TEXT = 4.5;
const SURFACES = ["card", "popover", "background"];
const PRIMITIVES = [
  "components/ui/input.tsx",
  "components/ui/textarea.tsx",
  "components/ui/select.tsx",
  "components/ui/command.tsx",
];

const css = readFileSync(join(root, "app/globals.css"), "utf8");

/** `--name: #rrggbb;` declarations of one block (`:root` or `.dark`). */
function tokens(selector: string): Map<string, string> {
  const block = css.match(
    new RegExp(`\\n${selector} \\{([\\s\\S]*?)\\n\\}`),
  )?.[1];
  assert.ok(block, `${selector} block not found in app/globals.css`);
  const map = new Map<string, string>();
  for (const match of block.matchAll(
    /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g,
  )) {
    const [, name = "", hex = ""] = match;
    map.set(name, hex);
  }
  return map;
}

const themes = { light: tokens(":root"), dark: tokens("\\.dark") };

function channel(hex: string, start: number): number {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return (
    0.2126 * channel(hex, 1) +
    0.7152 * channel(hex, 3) +
    0.0722 * channel(hex, 5)
  );
}

function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

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

// `placeholder:text-x` and `data-[placeholder]:text-x` (Select's value).
const PLACEHOLDER_COLOUR =
  /(?:data-\[)?placeholder\]?:text-([a-z][a-z0-9-]*)(\/[\d.]+)?/g;
const PLACEHOLDER_ARBITRARY = /(?:data-\[)?placeholder\]?:text-\[[^\]]+\]/g;

const declared = new Map<string, Set<string>>();
const problems: string[] = [];

for (const file of ["components", "app"].flatMap((dir) =>
  walk(join(root, dir), []),
)) {
  const name = relative(root, file);
  const source = readFileSync(file, "utf8");

  for (const [arbitrary] of source.matchAll(PLACEHOLDER_ARBITRARY))
    problems.push(`${name}: ${arbitrary} is not a token`);

  for (const match of source.matchAll(PLACEHOLDER_COLOUR)) {
    const [utility = "", token = "", opacity] = match;
    // `text-detail`, `text-sm`… are sizes: only colour tokens are checked.
    if (!css.includes(`--color-${token}: var(--${token})`)) continue;
    declared.set(name, (declared.get(name) ?? new Set()).add(utility));
    if (opacity) problems.push(`${name}: ${utility} fades the text`);

    for (const [theme, values] of Object.entries(themes)) {
      const foreground = values.get(token);
      if (!foreground) {
        problems.push(`${name}: --${token} is not a #rrggbb colour (${theme})`);
        continue;
      }
      const worst = SURFACES.map((surface) => {
        const background = values.get(surface);
        assert.ok(background, `--${surface} missing (${theme})`);
        return { surface, ratio: contrast(foreground, background) };
      }).reduce((a, b) => (b.ratio < a.ratio ? b : a));
      if (worst.ratio < AA_TEXT)
        problems.push(
          `${name}: ${utility} is ${worst.ratio.toFixed(2)}:1 on --${worst.surface} (${theme}), AA text needs ${AA_TEXT}:1`,
        );
    }
  }
}

for (const primitive of PRIMITIVES)
  if (!declared.has(primitive))
    problems.push(`${primitive}: no placeholder colour class found`);

assert.deepEqual(
  problems,
  [],
  "placeholders need a text token with AA contrast (text-muted-foreground), not the icon token",
);

console.log("placeholder-contrast: ok");
