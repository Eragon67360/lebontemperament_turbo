// Read-only smoke test of the website and the admin (24 checks). No writes.
//
//   node scripts/agent/smoke.mjs                       # staging (dev.* / admin-dev.*)
//   node scripts/agent/smoke.mjs https://www.lebontemperament.com https://admin.lebontemperament.com
//
// Staging is behind Vercel deployment protection: pass temporary share links
// (from the Vercel MCP tool `get_access_to_vercel_url`, valid ~23 h) in
// SHARE_WEBSITE and SHARE_ADMIN; their protection cookie is reused.
// The tracking-RPC check needs NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY (public values), read from the environment or
// from apps/website/.env.local.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const base = process.argv[2] ?? "https://dev.lebontemperament.com";
const adminBase = process.argv[3] ?? "https://admin-dev.lebontemperament.com";

const fileEnv = (() => {
  const file = join(root, "apps/website/.env.local");
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => /^[A-Z_0-9]+=/.test(l))
      .map((l) => [
        l.slice(0, l.indexOf("=")),
        l.slice(l.indexOf("=") + 1).replace(/^["']|["']$/g, ""),
      ]),
  );
})();
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const cookies = {};
for (const share of [process.env.SHARE_WEBSITE, process.env.SHARE_ADMIN].filter(
  Boolean,
)) {
  const r = await fetch(share, { redirect: "manual" });
  cookies[new URL(share).host] = (r.headers.getSetCookie?.() ?? [])
    .map((s) => s.split(";")[0])
    .join("; ");
}

const results = [];
let failed = 0;
const check = async (label, url, expect, extra = {}) => {
  const host = new URL(url).host;
  const r = await fetch(url, {
    redirect: "manual",
    method: extra.method,
    body: extra.body,
    headers: {
      ...(cookies[host] ? { cookie: cookies[host] } : {}),
      ...extra.headers,
    },
  });
  const body = r.status < 300 ? await r.text() : "";
  const notes = [];
  let ok = expect.includes(r.status);
  if (extra.noindex !== undefined) {
    const v = /<meta name="robots" content="[^"]*noindex/.test(body);
    notes.push(`noindex=${v}`);
    ok &&= v === extra.noindex;
  }
  if (extra.contains) {
    const v = body.includes(extra.contains);
    notes.push(`contains(${extra.contains})=${v}`);
    ok &&= v;
  }
  if (extra.notContains) {
    const v = !body.includes(extra.notContains);
    notes.push(`absent(${extra.notContains})=${v}`);
    ok &&= v;
  }
  if (extra.bodyIs !== undefined) {
    notes.push(body.trim());
    ok &&= body.trim() === extra.bodyIs;
  }
  if (!ok) failed++;
  const location =
    r.status >= 300 && r.status < 400
      ? new URL(r.headers.get("location"), url).pathname
      : "";
  results.push(
    `${ok ? "ok  " : "FAIL"} ${label.padEnd(34)} ${r.status} ${location} ${notes.join(" ")}`,
  );
};

await check("website home", `${base}/`, [200]);
await check("website concerts", `${base}/concerts`, [200]);
await check(
  "website unknown concert → 404",
  `${base}/concerts/ce-concert-n-existe-pas-0000`,
  [404],
);
await check("website galerie", `${base}/galerie`, [200]);
await check("website faq", `${base}/faq`, [200]);
await check("website don", `${base}/don`, [200]);
await check("website découvrir", `${base}/decouvrir`, [200]);
await check("website track (noindex)", `${base}/track`, [200], {
  noindex: true,
});
await check("website auth/login (noindex)", `${base}/auth/login`, [200], {
  noindex: true,
});
await check("website ag-2026 (noindex)", `${base}/ag-2026`, [200], {
  noindex: true,
});
await check("website sitemap", `${base}/sitemap.xml`, [200]);
await check("website robots has /track", `${base}/robots.txt`, [200], {
  contains: "/track",
});
await check("website feed", `${base}/feed.xml`, [200]);
await check("website removed /api/members", `${base}/api/members`, [404]);
await check(
  "website drive API w/o session",
  `${base}/api/drive/files?folderID=0000000000aaaa`,
  [401],
);
await check("website mentions légales", `${base}/mentions-legales`, [200], {
  contains: "Hébergement",
});
await check("website impressum → mentions", `${base}/impressum`, [308]);
await check("website contact: no maps script", `${base}/contact`, [200], {
  notContains: "maps.googleapis.com/maps/api/js",
});
await check("admin login", `${adminBase}/auth/login`, [200]);
await check("admin dashboard → login", `${adminBase}/dashboard`, [307]);
await check("admin /api/rehearsals anon", `${adminBase}/api/rehearsals`, [401]);
await check("admin /api/events anon", `${adminBase}/api/events`, [401]);
await check("admin /api/users/sync anon", `${adminBase}/api/users/sync`, [401]);
if (supabaseUrl && anonKey) {
  await check(
    "tracking RPC, fake token",
    `${supabaseUrl}/rest/v1/rpc/get_tracking_by_recipient_token`,
    [200],
    {
      method: "POST",
      body: JSON.stringify({ token: "00000000-0000-0000-0000-000000000000" }),
      bodyIs: "null",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
        "content-type": "application/json",
      },
    },
  );
} else {
  results.push("skip tracking RPC (no NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)");
}
console.log(results.join("\n"));
console.log(failed ? `SMOKE: ${failed} FAILED` : "SMOKE: OK");
process.exitCode = failed ? 1 : 0;
