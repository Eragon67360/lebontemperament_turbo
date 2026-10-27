// Run with: npx tsx lib/memberName.test.ts
//
// Names shown to other people or sent to the association (the app's contact
// form, the account deletion request, the members area) come from the
// member's profile (`profiles.display_name`, kept by the administrators),
// never from the account's metadata, which the account holder can change.
import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readProfileName } from "./memberName";

const ME = "11111111-1111-4111-8111-111111111111";

type Call = { table: string; columns: string; filters: [string, unknown][] };
type Result = { data: unknown; error: { message: string } | null };

function fakeClient(result: Result | Error, calls: Call[] = []) {
  return {
    from(table: string) {
      const call: Call = { table, columns: "", filters: [] };
      calls.push(call);
      const builder = {
        select(columns: string) {
          call.columns = columns;
          return builder;
        },
        eq(column: string, value: unknown) {
          call.filters.push([column, value]);
          return builder;
        },
        maybeSingle() {
          return result instanceof Error
            ? Promise.reject(result)
            : Promise.resolve(result);
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient<Database>;
}

async function main() {
  // The profile's name, trimmed, read from the member's own row only.
  {
    const calls: Call[] = [];
    const db = fakeClient(
      { data: { display_name: "  Prénom NOM " }, error: null },
      calls,
    );
    assert.equal(await readProfileName(db, ME), "Prénom NOM");
    assert.deepEqual(calls, [
      { table: "profiles", columns: "display_name", filters: [["id", ME]] },
    ]);
  }

  // No name on the profile, no row, a refused read or a failed request: null,
  // and the caller shows its own fallback (never another source of names).
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const result of [
      { data: { display_name: null }, error: null },
      { data: { display_name: "   " }, error: null },
      { data: null, error: null },
      { data: null, error: { message: "permission denied" } },
      new Error("fetch failed"),
    ]) {
      assert.equal(await readProfileName(fakeClient(result), ME), null);
    }
  } finally {
    console.warn = warn;
  }

  // No page, route, hook or helper reads a name from the account's metadata
  // (`user_metadata.display_name`, `metadata?.name`, `["full_name"]`…).
  const websiteRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) return sourceFiles(full);
      return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
    });
  const METADATA_NAME =
    /(?:user_metadata|\bmetadata)\s*(?:\??\.\s*(?:display_name|full_name|name)\b|(?:\?\.)?\s*\[\s*["'](?:display_name|full_name|name)["'])/;
  // « Télécharger mes données » gives members their own account's metadata.
  const ALLOWED = new Set([path.join("lib", "memberData.ts")]);

  const files = ["app", "components", "hooks", "lib", "utils"].flatMap((dir) =>
    sourceFiles(path.join(websiteRoot, dir)),
  );
  assert.ok(files.length > 100, "the website's sources were found");
  for (const file of files) {
    const relative = path.relative(websiteRoot, file);
    if (ALLOWED.has(relative)) continue;
    assert.ok(
      !METADATA_NAME.test(readFileSync(file, "utf8")),
      `${relative} reads a name from the account's metadata: use the profile's display_name (readProfileName, useMyProfile)`,
    );
  }
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

  console.log("memberName: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
