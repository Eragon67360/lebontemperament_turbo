// Read-only production checks through the Supabase Management API. No writes.
// Prints names, flags, statuses and counts only — never personal data.
//
//   SUPABASE_ACCESS_TOKEN=… node scripts/agent/prod-readonly-check.mjs
//
// The project ref is read from the `ref` claim of the public anon key
// (NEXT_PUBLIC_SUPABASE_ANON_KEY from the environment or apps/website/.env.local).
// Any production *write* (migration, function deploy, grant) is the owner's
// decision: write a dedicated, single-purpose script and ask first.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const envFile = join(root, "apps/website/.env.local");
const fileEnv = existsSync(envFile)
  ? Object.fromEntries(
      readFileSync(envFile, "utf8")
        .split("\n")
        .filter((l) => /^[A-Z_0-9]+=/.test(l))
        .map((l) => [
          l.slice(0, l.indexOf("=")),
          l.slice(l.indexOf("=") + 1).replace(/^["']|["']$/g, ""),
        ]),
    )
  : {};
const token = process.env.SUPABASE_ACCESS_TOKEN;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!token || !anonKey)
  throw new Error(
    "Set SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
const ref = JSON.parse(
  Buffer.from(anonKey.split(".")[1], "base64url").toString(),
).ref;

async function sql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  if (!res.ok)
    throw new Error(
      `query failed: ${res.status} ${(await res.text()).slice(0, 200)}`,
    );
  return res.json();
}

const section = async (title, query, format) => {
  try {
    const rows = await sql(query);
    console.log(`\n# ${title}`);
    for (const r of rows) console.log(format(r));
    if (!rows.length) console.log("(none)");
  } catch (e) {
    console.log(`\n# ${title}: ${String(e).slice(0, 160)}`);
  }
};

await section(
  "calendar sync, last runs",
  "select started_at::text, mode, status, jsonb_array_length(coalesce(errors,'[]'::jsonb)) as errs from public.rehearsal_sync_logs order by started_at desc limit 4",
  (r) => `${r.started_at.slice(0, 16)} ${r.mode} ${r.status} errors=${r.errs}`,
);
await section(
  "Drive index sync, last runs",
  "select started_at::text, trigger, mode, status, counts::text from public.drive_sync_runs order by started_at desc limit 4",
  (r) =>
    `${r.started_at.slice(0, 16)} ${r.trigger} ${r.mode} ${r.status} ${r.counts}`,
);
await section(
  "Drive index, live nodes per root",
  "select root_slug, kind, count(*)::int as n from public.drive_index_nodes where removed_at is null group by 1, 2 order by 1, 2",
  (r) => `${r.root_slug} ${r.kind}=${r.n}`,
);
await section(
  "SECURITY DEFINER functions executable by anon/authenticated",
  "select p.proname, pg_get_function_result(p.oid) as ret, has_function_privilege('anon', p.oid, 'EXECUTE') as anon, has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef order by 1",
  (r) =>
    `${r.proname} returns ${r.ret}: anon=${r.anon} authenticated=${r.auth}`,
);
await section(
  "cron jobs",
  "select jobname, schedule, active from cron.job order by 1",
  (r) => `${r.jobname} ${r.schedule} active=${r.active}`,
);
await section(
  "latest applied migrations",
  "select version from supabase_migrations.schema_migrations order by version desc limit 5",
  (r) => r.version,
);
