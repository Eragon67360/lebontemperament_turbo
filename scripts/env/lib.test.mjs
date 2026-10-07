import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  ROOT,
  checkSeedValues,
  customItemTemplate,
  fingerprint,
  itemTitles,
  mergeCandidates,
  parseDotenv,
  parseTemplate,
  planGithub,
  readTemplate,
  planVercel,
  validateTarget,
} from "./lib.mjs";

const rules = {
  productionVault: "LBT Production",
  stagingVault: "LBT Staging",
  productionOnlyItems: ["Supabase", "Sites"],
  stagingSupabaseRef: "stagingref",
};
const entry = (
  name,
  vault = "LBT Production",
  item = "Cloudinary",
  field = "api_key",
) => ({ name, vault, item, field });

test("parseTemplate reads references and skips comments and blank lines", () => {
  const { entries, errors } = parseTemplate(
    "# comment\n\nA_KEY=pass://LBT Production/Google OAuth/client_id\n",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(entries, [
    {
      name: "A_KEY",
      vault: "LBT Production",
      item: "Google OAuth",
      field: "client_id",
      line: 3,
    },
  ]);
});

test("parseTemplate refuses plain values without echoing them", () => {
  const { entries, errors } = parseTemplate("SECRET=hunter2-do-not-print");
  assert.equal(entries.length, 0);
  assert.equal(errors.length, 1);
  assert.doesNotMatch(errors[0], /hunter2/);
});

test("parseTemplate refuses duplicates, bad names and short references", () => {
  const { errors } = parseTemplate(
    "A=pass://V/I/f\nA=pass://V/I/g\nlower=pass://V/I/f\nB=pass://V/I\n",
  );
  assert.equal(errors.length, 3);
});

test("validateTarget keeps staging out of production and production Supabase out of staging", () => {
  const prod = {
    kind: "vercel",
    project: "p",
    environments: ["production"],
    production: true,
  };
  const dev = {
    kind: "vercel",
    project: "p",
    environments: ["preview", "development"],
    production: false,
  };
  assert.equal(
    validateTarget("p", prod, [entry("A", "LBT Staging", "Supabase")], rules)
      .length,
    1,
  );
  assert.equal(
    validateTarget("d", dev, [entry("A", "LBT Production", "Supabase")], rules)
      .length,
    1,
  );
  assert.equal(
    validateTarget(
      "d",
      dev,
      [entry("A", "LBT Production", "Cloudinary")],
      rules,
    ).length,
    0,
  );
  const repo = { kind: "github", production: true, allowStagingItems: ["E2E"] };
  assert.equal(
    validateTarget("r", repo, [entry("A", "LBT Staging", "E2E")], rules).length,
    0,
  );
  assert.equal(
    validateTarget("r", repo, [entry("A", "LBT Staging", "Supabase")], rules)
      .length,
    1,
  );
  assert.equal(
    validateTarget("x", prod, [entry("A", "Personal")], rules).length,
    1,
  );
});

const fpOf = (name, value) => fingerprint("k", "t", name, value);
const values = { A: "1", B: "2", C: "3", D: "4", E: "5" };

test("planVercel sorts variables into create, update, overwrite, unchanged, split and conflict", () => {
  const environments = ["preview", "development"];
  const existing = [
    { id: "b", key: "B", target: ["preview", "development"] },
    { id: "c", key: "C", target: ["preview", "development"] },
    { id: "d", key: "D", target: ["production", "preview", "development"] },
    { id: "e", key: "E", target: ["preview"] },
    { id: "p", key: "A", target: ["production"] },
    { id: "x", key: "X", target: ["development"] },
    { id: "y", key: "Y", target: ["production"] },
    { id: "z", key: "B", target: ["preview"], gitBranch: "feature" },
  ];
  const known = { B: fpOf("B", "old"), C: fpOf("C", "3") };
  const { actions, extras } = planVercel({
    entries: ["A", "B", "C", "D", "E"].map((n) => entry(n)),
    existing,
    environments,
    values,
    known,
    fingerprintOf: fpOf,
    force: false,
  });
  const byName = Object.fromEntries(actions.map((a) => [a.name, a]));
  assert.equal(byName.A.action, "create"); // the production copy doesn't count
  assert.equal(byName.B.action, "update");
  assert.equal(byName.C.action, "unchanged");
  assert.equal(byName.D.action, "split");
  assert.deepEqual(byName.D.keep, ["production"]);
  assert.equal(byName.E.action, "conflict");
  assert.deepEqual(extras, ["X"]);
});

test("planVercel with force rewrites unchanged values", () => {
  const { actions } = planVercel({
    entries: [entry("C")],
    existing: [{ id: "c", key: "C", target: ["production"] }],
    environments: ["production"],
    values,
    known: { C: fpOf("C", "3") },
    fingerprintOf: fpOf,
    force: true,
  });
  assert.equal(actions[0].action, "update");
});

test("planGithub reports create, unchanged, overwrite and extras", () => {
  const { actions, extras } = planGithub({
    entries: [entry("A"), entry("B"), entry("C")],
    existingNames: ["B", "C", "OLD"],
    values,
    known: { B: fpOf("B", "2") },
    fingerprintOf: fpOf,
    force: false,
  });
  assert.deepEqual(
    actions.map((a) => a.action),
    ["create", "unchanged", "overwrite"],
  );
  assert.deepEqual(extras, ["OLD"]);
});

test("the templates in env/ pass the check", () => {
  const result = spawnSync(
    process.execPath,
    [join(ROOT, "scripts", "env", "check.mjs")],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("push.mjs stops before any network call when pass-cli didn't resolve the values", () => {
  const result = spawnSync(
    process.execPath,
    [join(ROOT, "scripts", "env", "push.mjs"), "website.dev"],
    {
      encoding: "utf8",
      env: { PATH: process.env.PATH, HOME: "/nonexistent-home" },
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /has no value/);
});

test("a GitHub dry run prints names only and refuses to write production without --prod", () => {
  const dir = mkdtempSync(join(tmpdir(), "lbt-env-"));
  const log = join(dir, "gh.log");
  writeFileSync(
    join(dir, "gh"),
    `#!/bin/sh\necho "$@" >> "${log}"\ncase "$*" in *list*) echo '[{"name":"ANDROID_SERVICE_ACCOUNT_JSON"},{"name":"OLD"}]';; esac\n`,
    { mode: 0o755 },
  );
  const secret = "very-secret-value-that-must-not-print";
  const run = (...flags) =>
    spawnSync(
      process.execPath,
      [join(ROOT, "scripts", "env", "push.mjs"), "github.play-store", ...flags],
      {
        encoding: "utf8",
        env: {
          PATH: `${dir}:${process.env.PATH}`,
          HOME: dir,
          ANDROID_SERVICE_ACCOUNT_JSON: secret,
        },
      },
    );

  const dry = run();
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /overwrite\s+ANDROID_SERVICE_ACCOUNT_JSON/);
  assert.match(dry.stdout, /extra\s+OLD/);
  assert.doesNotMatch(dry.stdout + dry.stderr, new RegExp(secret));

  const refused = run("--apply");
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /add --prod/);
  assert.doesNotMatch(readFileSync(log, "utf8"), /secret set/);
  rmSync(dir, { recursive: true, force: true });
});

test("parseDotenv reads vercel env pull files", () => {
  const values = parseDotenv(
    "# c\nA=\"x\\ny\"\nexport B=plain\nC='q'\nbad line\n",
  );
  assert.deepEqual(Object.fromEntries(values), {
    A: "x\ny",
    B: "plain",
    C: "q",
  });
});

test("mergeCandidates lets the stronger source win and flags same-level conflicts", () => {
  const { resolved, conflicts } = mergeCandidates([
    { ref: "V/I/a", value: "1", source: "vercel x", level: 1 },
    { ref: "V/I/a", value: "2", source: "file", level: 3 },
    { ref: "V/I/b", value: "1", source: "vercel x", level: 1 },
    { ref: "V/I/b", value: "2", source: "vercel y", level: 1 },
    { ref: "V/I/c", value: "1", source: "vercel x", level: 1 },
    { ref: "V/I/c", value: "1", source: "vercel y", level: 1 },
    { ref: "V/I/d", value: "", source: "vercel x", level: 1 },
  ]);
  assert.equal(resolved.get("V/I/a").value, "2");
  assert.deepEqual(conflicts.get("V/I/b"), ["vercel x", "vercel y"]);
  assert.deepEqual(resolved.get("V/I/c").sources, ["vercel x", "vercel y"]);
  assert.equal(resolved.has("V/I/d"), false);
});

test("checkSeedValues keeps the staging and production Supabase projects apart", () => {
  const jwt = (ref) =>
    `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ ref })).toString("base64url")}.sig`;
  const check = (pairs) =>
    checkSeedValues(
      new Map(pairs.map(([ref, value]) => [ref, { value }])),
      rules,
    );
  assert.deepEqual(
    check([
      ["LBT Staging/Supabase/url", "https://stagingref.supabase.co"],
      ["LBT Staging/Supabase/anon_key", jwt("stagingref")],
      ["LBT Production/Supabase/url", "https://prodref.supabase.co"],
      ["LBT Production/Supabase/anon_key", jwt("prodref")],
    ]),
    [],
  );
  const errors = check([
    ["LBT Staging/Supabase/url", "https://prodref.supabase.co"],
    ["LBT Staging/Supabase/anon_key", jwt("prodref")],
    [
      "LBT Production/Supabase/db_url",
      "postgres://x@db.stagingref.supabase.co",
    ],
    ["LBT Production/Supabase/anon_key", jwt("stagingref")],
  ]);
  assert.equal(errors.length, 4);
  assert.doesNotMatch(errors.join("\n"), /prodref|postgres/);
});

test("customItemTemplate hides secrets and keeps every field", () => {
  const t = customItemTemplate("Cloudinary", ["api_secret", "cloud_name"], {
    cloud_name: "lbt",
  });
  assert.equal(t.title, "Cloudinary");
  assert.deepEqual(t.sections[0].fields, [
    { field_name: "api_secret", field_type: "hidden", value: "" },
    { field_name: "cloud_name", field_type: "text", value: "lbt" },
  ]);
});

test("itemTitles finds titles wherever pass-cli nests them", () => {
  assert.deepEqual(
    [
      ...itemTitles({ items: [{ content: { title: "A" } }, { title: "B" }] })
        .titles,
    ],
    ["A", "B"],
  );
  assert.equal(itemTitles([]).readable, true);
  assert.equal(itemTitles([{ id: "x" }]).readable, false);
});

test("seed.mjs creates missing items through stdin, prints no value, and refuses a production URL in staging", () => {
  const dir = mkdtempSync(join(tmpdir(), "lbt-seed-"));
  const created = join(dir, "created.jsonl");
  writeFileSync(
    join(dir, "pass-cli"),
    `#!/bin/sh\ncase "$*" in\n  "item list LBT Staging"*) echo '[{"title":"E2E"}]';;\n  "item create custom"*) cat >> "${created}"; echo >> "${created}";;\n  *) exit 3;;\nesac\n`,
    { mode: 0o755 },
  );
  const secret = "sb_secret_must-not-print";
  const keyFile = join(dir, "key");
  writeFileSync(keyFile, `${secret}\n`);
  const dotenv = join(dir, "dev.env");
  const run = (url, ...flags) => {
    writeFileSync(dotenv, `NEXT_PUBLIC_SUPABASE_URL="${url}"\n`);
    return spawnSync(
      process.execPath,
      [
        join(ROOT, "scripts", "env", "seed.mjs"),
        "--vault",
        "LBT Staging",
        "--dotenv",
        `website.dev=${dotenv}`,
        "--file",
        `LBT Staging/Supabase/service_role_key=${keyFile}`,
        ...flags,
      ],
      {
        encoding: "utf8",
        env: { PATH: `${dir}:${process.env.PATH}`, HOME: dir },
      },
    );
  };
  try {
    const refused = run("https://prodref.supabase.co", "--apply");
    assert.equal(refused.status, 1);
    assert.match(
      refused.stderr,
      /LBT Staging\/Supabase\/url is not the staging/,
    );

    const staging = "https://cevuqyhwtzjujxsocxkb.supabase.co";
    const dry = run(staging);
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /LBT Staging \/ E2E\s+exists, left alone/);
    assert.match(dry.stdout, /service_role_key\s+from file/);
    assert.match(dry.stdout, /anon_key\s+empty/);

    const applied = run(staging, "--apply");
    assert.equal(applied.status, 0, applied.stderr);
    assert.doesNotMatch(applied.stdout + applied.stderr, new RegExp(secret));
    const items = readFileSync(created, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.deepEqual(items.map((i) => i.title).sort(), ["Sites", "Supabase"]);
    const supabase = items.find((i) => i.title === "Supabase").sections[0]
      .fields;
    assert.deepEqual(
      Object.fromEntries(supabase.map((f) => [f.field_name, f.value])),
      { anon_key: "", service_role_key: secret, url: staging },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("push.mjs skips optional names left empty and still stops on required ones", () => {
  const { entries } = readTemplate("website.dev");
  const env = {
    PATH: process.env.PATH,
    HOME: mkdtempSync(join(tmpdir(), "lbt-opt-")),
  };
  for (const { name } of entries) env[name] = "x";
  const run = (extra) =>
    spawnSync(
      process.execPath,
      [join(ROOT, "scripts", "env", "push.mjs"), "website.dev"],
      { encoding: "utf8", env: { ...env, ...extra } },
    );
  try {
    // Optional name empty: gets past the value check, then stops on the missing token.
    const optional = run({ REVALIDATE_SECRET: "" });
    assert.equal(optional.status, 1);
    assert.match(optional.stderr, /No Vercel token/);
    const required = run({ SMTP_PASSWORD: "" });
    assert.equal(required.status, 1);
    assert.match(required.stderr, /SMTP_PASSWORD has no value/);
  } finally {
    rmSync(env.HOME, { recursive: true, force: true });
  }
});
