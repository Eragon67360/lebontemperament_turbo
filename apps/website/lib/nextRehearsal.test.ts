// Run with: npx tsx lib/nextRehearsal.test.ts
//
// /concerts shows visitors the date of the next rehearsal. The rehearsals
// table is for signed-in members, so the page reads that one row on the server
// with the service role (lib/nextRehearsal.ts), never with the public key, and
// no other website code reads the table without a signed-in member.
import type { Database } from "@repo/domain/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNextRehearsal } from "./nextRehearsal";
import { REHEARSAL_COLUMNS } from "./publicConcerts";

type Client = SupabaseClient<Database>;

/** A query builder that records the calls and resolves to `result`. */
function fakeClient(result: { data: unknown; error: unknown }) {
  const calls: unknown[][] = [];
  const builder: Record<string, unknown> = {
    then: (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  for (const method of ["select", "gte", "order", "limit"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  const client = {
    from: (table: string) => {
      calls.push(["from", table]);
      return builder;
    },
  } as unknown as Client;
  return { client, calls };
}

const silenced = async <T>(run: () => Promise<T>): Promise<T> => {
  const original = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = original;
  }
};

async function main() {
  // The page shows the date only, so the read selects the date only.
  assert.deepEqual(
    REHEARSAL_COLUMNS.split(",").map((c) => c.trim()),
    ["date"],
  );

  // One row: the first rehearsal on or after today.
  {
    const { client, calls } = fakeClient({
      data: [{ date: "2026-11-05" }],
      error: null,
    });
    const rows = await loadNextRehearsal(() => client, "2026-10-26");
    assert.deepEqual(rows, [{ date: "2026-11-05" }]);
    assert.deepEqual(calls, [
      ["from", "rehearsals"],
      ["select", "date"],
      ["gte", "date", "2026-10-26"],
      ["order", "date", { ascending: true }],
      ["limit", 1],
    ]);
  }

  // No upcoming rehearsal: no line.
  {
    const { client } = fakeClient({ data: [], error: null });
    assert.deepEqual(await loadNextRehearsal(() => client, "2026-10-26"), []);
  }

  // A refused or failed read leaves the agenda without the line.
  {
    const { client } = fakeClient({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });
    const rows = await silenced(() =>
      loadNextRehearsal(() => client, "2026-10-26"),
    );
    assert.deepEqual(rows, []);
  }

  // So does a client that can't be created (no service-role key, as in CI).
  {
    const rows = await silenced(() =>
      loadNextRehearsal(() => {
        throw new Error("supabaseKey is required.");
      }, "2026-10-26"),
    );
    assert.deepEqual(rows, []);
  }

  // Source checks over the website.
  const websiteRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)
        ? [full]
        : [];
    });
  const files = ["app", "components", "lib", "hooks", "utils"].flatMap((dir) =>
    sourceFiles(path.join(websiteRoot, dir)),
  );
  const relative = (file: string) => path.relative(websiteRoot, file);

  // The page passes the service-role client to the helper and doesn't read
  // the table itself.
  const page = readFileSync(
    path.join(websiteRoot, "app", "concerts", "page.tsx"),
    "utf8",
  );
  assert.match(page, /loadNextRehearsal\(\s*createAdminClient\s*,/);

  // Exactly these files read the rehearsals table, all on the server: the
  // members' API (session checked first) and the agenda's helper. A new
  // reader is reviewed and added here.
  const READS_REHEARSALS = /\.from\(\s*["'`]rehearsals["'`]\s*\)/;
  const readers = files.filter((file) =>
    READS_REHEARSALS.test(readFileSync(file, "utf8")),
  );
  assert.deepEqual(readers.map(relative).sort(), [
    path.join("app", "api", "rehearsals", "route.ts"),
    path.join("lib", "nextRehearsal.ts"),
  ]);
  for (const file of readers) {
    const source = readFileSync(file, "utf8");
    assert.ok(
      !/^\s*["']use client["'];?\s*$/m.test(source),
      `${relative(file)} reads rehearsals in the browser`,
    );
    assert.ok(
      !source.includes("createPublicClient"),
      `${relative(file)} reads rehearsals with the public key`,
    );
  }

  // No Realtime subscription to the table from the website.
  for (const file of files) {
    assert.ok(
      !/table:\s*["'`]rehearsals["'`]/.test(readFileSync(file, "utf8")),
      `${relative(file)} subscribes to rehearsals`,
    );
  }

  console.log("nextRehearsal: all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
