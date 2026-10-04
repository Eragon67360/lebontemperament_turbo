#!/usr/bin/env node
// Runs every *.test.ts / *.test.tsx under utils/, lib/, components/ and app/
// with tsx, one after the other, and stops at the first failure. Replaces the
// hand-maintained `tsx a.test.ts && tsx b.test.ts && …` chain that every
// branch used to edit (#473). `--list` prints the files and exits.
//
// Components are rendered with react-dom/server in some tests, so tsx reads
// tsconfig.test.json (`jsx: react-jsx`; the app's `preserve` is for Next).
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const ROOTS = ["utils", "lib", "components", "app"];
const SKIP = new Set(["node_modules", ".next", ".turbo"]);
const TEST_FILE = /\.test\.tsx?$/;

function walk(dir, out) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.isFile() && TEST_FILE.test(entry.name)) out.push(path);
  }
  return out;
}

const files = ROOTS.filter((name) => existsSync(join(root, name)))
  .flatMap((name) => walk(join(root, name), []))
  .map((file) => relative(root, file))
  .sort();

if (process.argv.includes("--list")) {
  for (const file of files) console.log(file);
  process.exit(0);
}

if (files.length === 0) {
  console.error("No test file found.");
  process.exit(1);
}

const tsx = fileURLToPath(import.meta.resolve("tsx/cli"));
const started = Date.now();

for (const file of files) {
  console.log(`▶ ${file}`);
  const result = spawnSync(
    process.execPath,
    [tsx, "--tsconfig", "tsconfig.test.json", file],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    console.error(`✖ ${file} failed (exit code ${result.status ?? "signal"})`);
    process.exit(result.status ?? 1);
  }
}

console.log(
  `✔ ${files.length} test files passed in ${((Date.now() - started) / 1000).toFixed(1)} s`,
);
