// Run with: npx tsx lib/serviceRoleClient.test.ts
//
// The service-role client (utils/supabase/admin.ts) bypasses RLS: it is
// server-only, so a client component importing it fails the build, and it
// keeps no session. Read as text, because importing `server-only` fails
// outside Next's bundler.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../utils/supabase/admin.ts", import.meta.url),
  "utf8",
);
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

assert.match(
  code,
  /^\s*import "server-only";/,
  'utils/supabase/admin.ts starts with import "server-only"',
);
for (const option of [
  "autoRefreshToken",
  "persistSession",
  "detectSessionInUrl",
]) {
  assert.match(
    code,
    new RegExp(`\\b${option}: false,`),
    `the service-role client sets ${option}: false`,
  );
}
assert.doesNotMatch(code, /: true\b/, "no auth option of the client is on");

console.log("✔ service-role client: server-only, no session");
