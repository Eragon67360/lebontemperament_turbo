// The names the admin shows (the account menu, the home's greeting, the
// members' screens) come from `profiles.display_name`, which the
// administrators keep, never from an account's metadata, which the account
// holder can change. This scans the admin's sources for a name read from the
// metadata (`user_metadata.display_name`, `metadata?.name`, `["full_name"]`…).
// Writing the name into the metadata (`user_metadata: { display_name }`) is
// fine: it only keeps the sign-in screens in step.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SKIP = new Set(["node_modules", ".next", ".turbo"]);
const METADATA_NAME =
  /(?:user_metadata|\bmetadata)\s*(?:\??\.\s*(?:display_name|full_name|name)\b|(?:\?\.)?\s*\[\s*["'](?:display_name|full_name|name)["'])/;

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

const files = ["app", "components", "hooks", "lib", "utils"].flatMap((dir) =>
  walk(join(root, dir), []),
);
assert.ok(files.length > 100, "the admin's sources were found");

const offenders = files
  .filter((file) => METADATA_NAME.test(readFileSync(file, "utf8")))
  .map((file) => relative(root, file));
assert.deepEqual(
  offenders,
  [],
  `These files read a name from the account's metadata; use the profile's display_name (useCurrentProfile): ${offenders.join(", ")}`,
);

for (const sample of [
  "user?.user_metadata?.display_name",
  "user.user_metadata.name",
  "metadata.full_name",
  'user.user_metadata?.["display_name"]',
]) {
  assert.ok(METADATA_NAME.test(sample), sample);
}
for (const sample of [
  "user_metadata: { display_name }",
  "user.user_metadata?.avatar_url",
  "export const metadata: Metadata = { title }",
]) {
  assert.ok(!METADATA_NAME.test(sample), sample);
}

console.log("displayNames: ok");
