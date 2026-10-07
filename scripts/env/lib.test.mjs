import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  ROOT,
  fingerprint,
  parseTemplate,
  planGithub,
  planVercel,
  validateTarget,
} from "./lib.mjs";

const rules = {
  productionVault: "LBT Production",
  stagingVault: "LBT Staging",
  productionOnlyItems: ["Supabase", "Sites"],
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
