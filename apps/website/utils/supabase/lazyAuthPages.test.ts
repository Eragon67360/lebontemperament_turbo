// The sign-in pages and forms (`app/auth/**`, `components/auth/*`) load
// supabase-js on submit through `loadBrowserClient`, never with the page, so
// the eager `createClient` stays out of their sources. And the session-cookie
// check that lets the public pages skip supabase-js for visitors.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { hasSessionCookie } from "./lazy";

const root = fileURLToPath(new URL("../..", import.meta.url));

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

// --- No sign-in page or form imports the browser client with the page ---
{
  const eager = /from\s+["']@\/utils\/supabase\/client["']/;
  let checked = 0;
  for (const dir of ["app/auth", "components/auth"]) {
    for (const file of sources(join(root, dir))) {
      checked += 1;
      assert.doesNotMatch(
        readFileSync(file, "utf8"),
        eager,
        `${relative(root, file)} loads supabase-js with the page`,
      );
    }
  }
  assert.ok(checked >= 8, `only ${checked} sign-in sources found`);
}

// --- A session cookie, chunked or not; nothing else counts ---
{
  const doc = { cookie: "" };
  const global = globalThis as { document?: typeof doc };
  global.document = doc;
  assert.equal(hasSessionCookie(), false);
  doc.cookie = "theme=dark; sb-abcdefgh-auth-token=base64-eyJ";
  assert.equal(hasSessionCookie(), true);
  doc.cookie = "sb-abcdefgh-auth-token.0=eyJ; sb-abcdefgh-auth-token.1=abc";
  assert.equal(hasSessionCookie(), true);
  doc.cookie = "sb-abcdefgh-auth-token-code-verifier=xyz";
  assert.equal(hasSessionCookie(), false);
  delete global.document;
  assert.equal(hasSessionCookie(), false);
}

console.log("supabase/lazy: all assertions passed");
