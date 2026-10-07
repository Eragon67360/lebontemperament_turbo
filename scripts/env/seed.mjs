#!/usr/bin/env node
// npm run env:seed -- [sources] [--vault NAME] [--apply]
//
// Fills the Proton Pass vaults once, so the env/ templates resolve. Runs on the
// owner's Mac, signed in with `pass-cli login`. It creates each missing item as a
// custom item with exactly the fields the templates read; items that already exist
// are left alone. Dry run unless --apply.
//
// Sources, from weakest to strongest (a stronger one wins; two different values at the
// same strength are a conflict and the field is left empty):
//   --vercel                  Vercel's current values (not "sensitive" ones, which
//                             can't be read back), through the token in env/sync.env
//   --dotenv <target>=<path>  a dotenv file holding that target's variables
//   --file <ref>=<path>       one field from a file (JSON keys, the .p8 key)
//   --base64 <ref>=<path>     one field from a binary file, base64-encoded (keystore)
//   --ask                     prompts, without echo, for each field still empty
// <ref> is vault/item/field, e.g. "LBT Production/Android signing/keystore_base64".
//
// Values go to pass-cli on standard input: never in a command line, a file or the
// output, which names variables and fields only.

import { spawnSync } from "node:child_process";
import {
  closeSync,
  openSync,
  readFileSync,
  readSync,
  writeSync,
} from "node:fs";
import { join } from "node:path";
import {
  ENV_DIR,
  ROOT,
  checkSeedValues,
  customItemTemplate,
  itemTitles,
  loadTargets,
  mergeCandidates,
  parseDotenv,
  readTemplate,
  refKey,
} from "./lib.mjs";

const LEVEL = { vercel: 1, dotenv: 2, file: 3, ask: 4 };
// Multi-line values: --ask can't take them, they come from --file or --base64.
const FILE_FIELDS = new Set([
  "keystore_base64",
  "key_p8",
  "json",
  "service_account_json",
]);

const config = loadTargets();
const opts = parseArgs(process.argv.slice(2));

// Reading Vercel needs the token: run again inside `pass-cli run`, which resolves it.
if (opts.vercel && !process.env.LBT_SYNC_VERCEL_TOKEN) {
  const run = spawnSync(
    "pass-cli",
    [
      "run",
      "--env-file",
      join(ENV_DIR, "sync.env"),
      "--",
      process.execPath,
      ...process.argv.slice(1),
    ],
    { stdio: "inherit", cwd: ROOT },
  );
  if (run.error?.code === "ENOENT")
    fail("pass-cli is not installed: see env/README.md, then pass-cli login.");
  process.exit(run.status ?? 1);
}

// What the templates read: target -> entries, and vault/item -> fields.
const templates = {};
for (const target of [...Object.keys(config.targets), "sync"]) {
  const { entries, errors } = readTemplate(target);
  if (errors.length) fail(errors.join("\n"));
  templates[target] = entries;
}
const items = new Map();
for (const entries of Object.values(templates)) {
  for (const e of entries) {
    if (opts.vault && e.vault !== opts.vault) continue;
    const key = `${e.vault}/${e.item}`;
    if (!items.has(key))
      items.set(key, { vault: e.vault, item: e.item, fields: new Set() });
    items.get(key).fields.add(e.field);
  }
}
if (!items.size) fail(`No template reads the vault "${opts.vault}".`);
// A field is optional when every variable that reads it may be left out of a push.
const refNames = new Map();
for (const e of Object.values(templates).flat()) {
  if (!refNames.has(refKey(e))) refNames.set(refKey(e), new Set());
  refNames.get(refKey(e)).add(e.name);
}
const isOptional = (ref) =>
  [...(refNames.get(ref) ?? [])].every((name) => config.optional?.[name]);
const wanted = new Set(
  [...items.values()].flatMap(({ vault, item, fields }) =>
    [...fields].map((field) => refKey({ vault, item, field })),
  ),
);

// Gather candidates. `notes` explains, per reference, why a field may stay empty.
const candidates = [];
const notes = new Map();
const note = (ref, text) => {
  if (!notes.has(ref)) notes.set(ref, new Set());
  notes.get(ref).add(text);
};

if (opts.vercel) {
  for (const [target, t] of Object.entries(config.targets)) {
    if (t.kind !== "vercel") continue;
    const entries = templates[target].filter((e) => wanted.has(refKey(e)));
    if (!entries.length) continue;
    const project = encodeURIComponent(t.project);
    const { envs = [], pagination } = await vercel(
      `/v10/projects/${project}/env`,
    );
    if (pagination?.next)
      fail("Vercel returned a partial list; this script needs updating.");
    for (const e of entries) {
      const ref = refKey(e);
      const matches = envs.filter(
        (env) =>
          env.key === e.name &&
          !env.gitBranch &&
          !env.customEnvironmentIds?.length &&
          [].concat(env.target ?? []).includes(t.environments[0]),
      );
      if (matches.length !== 1) {
        if (matches.length > 1)
          note(ref, `several ${e.name} in Vercel ${target}`);
        continue;
      }
      if (!["encrypted", "plain"].includes(matches[0].type)) {
        note(ref, `${e.name} is ${matches[0].type} in Vercel ${target}`);
        continue;
      }
      const env = await vercel(`/v1/projects/${project}/env/${matches[0].id}`);
      // Without `decrypted`, the value would be Vercel's ciphertext.
      if (!(env.decrypted === true || env.type === "plain")) {
        note(ref, `Vercel did not decrypt ${e.name} (${target})`);
        continue;
      }
      const { value } = env;
      candidates.push({
        ref,
        value,
        source: `vercel ${target}`,
        level: LEVEL.vercel,
      });
    }
  }
}

for (const [target, path] of opts.dotenv) {
  if (!templates[target] || target === "sync")
    fail(`--dotenv: unknown target "${target}"`);
  const values = parseDotenv(readFile(path));
  for (const e of templates[target]) {
    if (!wanted.has(refKey(e)) || !values.has(e.name)) continue;
    candidates.push({
      ref: refKey(e),
      value: values.get(e.name),
      source: `dotenv ${target}`,
      level: LEVEL.dotenv,
    });
  }
}

for (const [ref, path, encoding] of opts.files) {
  if (!wanted.has(ref))
    fail(
      `--file/--base64: no template reads "${ref}"${opts.vault ? ` in ${opts.vault}` : ""}`,
    );
  const content = readFileSync(path);
  candidates.push({
    ref,
    value:
      encoding === "base64"
        ? content.toString("base64")
        : content.toString("utf8").replace(/\n$/, ""),
    source: encoding === "base64" ? "file, base64" : "file",
    level: LEVEL.file,
  });
}

let { resolved, conflicts } = mergeCandidates(candidates);
for (const [ref, sources] of conflicts)
  note(ref, `different values in ${sources.join(" and ")}`);
const errors = checkSeedValues(resolved, config.rules);
if (errors.length) fail(`Refused, nothing written:\n  ${errors.join("\n  ")}`);

// Items already in the vaults are left alone.
const existing = new Map();
for (const vault of new Set([...items.values()].map((i) => i.vault))) {
  const result = spawnSync(
    "pass-cli",
    ["item", "list", vault, "--output", "json"],
    { encoding: "utf8" },
  );
  if (result.error?.code === "ENOENT")
    fail("pass-cli is not installed: see env/README.md, then pass-cli login.");
  if (result.status !== 0)
    fail(
      `pass-cli could not list "${vault}": ${firstLine(result.stderr)}. Does the vault exist, and is pass-cli login done?`,
    );
  let json;
  try {
    json = JSON.parse(result.stdout || "[]");
  } catch {
    fail(
      `pass-cli's item list for "${vault}" is not JSON; this script needs updating.`,
    );
  }
  const { titles, readable } = itemTitles(json);
  if (!readable)
    fail(
      `Could not read item titles from pass-cli for "${vault}"; this script needs updating.`,
    );
  existing.set(vault, titles);
}

const toCreate = [];
console.log("");
for (const { vault, item, fields } of [...items.values()].sort((a, b) =>
  `${a.vault}/${a.item}`.localeCompare(`${b.vault}/${b.item}`),
)) {
  if (existing.get(vault).has(item)) {
    console.log(`${vault} / ${item}   exists, left alone`);
    continue;
  }
  const list = [...fields].sort();
  toCreate.push({ vault, item, fields: list });
  console.log(`${vault} / ${item}   create`);
  for (const field of list) {
    const ref = refKey({ vault, item, field });
    const found = resolved.get(ref);
    const why = [...(notes.get(ref) ?? [])].join("; ");
    const status = found
      ? `from ${found.sources.join(", ")}`
      : `empty${why ? `: ${why}` : ""}${isOptional(ref) ? " (optional)" : ""}${FILE_FIELDS.has(field) ? " (from a file: --file or --base64)" : opts.ask ? " (will ask)" : ""}`;
    console.log(`    ${field.padEnd(24)} ${status}`);
  }
}

if (!toCreate.length) {
  console.log("\nEvery item exists already: nothing to create.");
  process.exit(0);
}
if (!opts.apply) {
  console.log(
    `\nDry run: ${toCreate.length} items to create. Nothing written; add --apply to create them.`,
  );
  process.exit(0);
}

if (opts.ask) {
  console.log(
    "\nType each value and press Enter (nothing shows), or just Enter to leave it empty.",
  );
  const asked = [];
  for (const { vault, item, fields } of toCreate) {
    for (const field of fields) {
      const ref = refKey({ vault, item, field });
      if (resolved.has(ref) || FILE_FIELDS.has(field)) continue;
      const value = askHidden(`  ${ref}: `);
      if (value) asked.push({ ref, value, source: "typed", level: LEVEL.ask });
    }
  }
  ({ resolved } = mergeCandidates([...candidates, ...asked]));
  const askErrors = checkSeedValues(resolved, config.rules);
  if (askErrors.length)
    fail(`Refused, nothing written:\n  ${askErrors.join("\n  ")}`);
}

console.log("");
let failed = 0;
const empty = [];
for (const { vault, item, fields } of toCreate) {
  const values = {};
  for (const field of fields) {
    const found = resolved.get(refKey({ vault, item, field }));
    if (found) values[field] = found.value;
    else empty.push(refKey({ vault, item, field }));
  }
  const result = spawnSync(
    "pass-cli",
    ["item", "create", "custom", "--vault-name", vault, "--from-template", "-"],
    {
      input: JSON.stringify(customItemTemplate(item, fields, values)),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (result.status === 0) console.log(`  created    ${vault} / ${item}`);
  else {
    failed++;
    console.log(
      `  FAILED     ${vault} / ${item}   ${firstLine(result.stderr)}`,
    );
  }
}
console.log(`\n${toCreate.length - failed} created, ${failed} failed.`);
if (empty.length) {
  console.log(
    `Fill these empty fields in the Proton Pass app (same field names):\n  ${empty.join("\n  ")}`,
  );
}
console.log(
  "Then check: npm run env:push -- dev   (dry run; it stops on any value still missing)",
);
process.exit(failed ? 1 : 0);

// ---------------------------------------------------------------------------

function fail(message) {
  console.error(message);
  process.exit(1);
}

function firstLine(text) {
  return (text ?? "").trim().split("\n")[0];
}

function readFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    fail(`Cannot read ${path}: ${error.code}`);
  }
}

function parseArgs(args) {
  const opts = {
    dotenv: [],
    files: [],
    vercel: false,
    ask: false,
    apply: false,
  };
  const pair = (flag, value) => {
    const eq = value?.indexOf("=") ?? -1;
    if (eq < 1) fail(`${flag} expects <name>=<path>`);
    return [value.slice(0, eq), value.slice(eq + 1)];
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--vercel") opts.vercel = true;
    else if (arg === "--ask") opts.ask = true;
    else if (arg === "--apply") opts.apply = true;
    else if (arg === "--vault") opts.vault = args[++i];
    else if (arg === "--dotenv") opts.dotenv.push(pair(arg, args[++i]));
    else if (arg === "--file")
      opts.files.push([...pair(arg, args[++i]), "utf8"]);
    else if (arg === "--base64")
      opts.files.push([...pair(arg, args[++i]), "base64"]);
    else
      fail(
        `Unknown option "${arg}". Usage: npm run env:seed -- [--vercel] [--dotenv <target>=<path>] [--file <ref>=<path>] [--base64 <ref>=<path>] [--ask] [--vault NAME] [--apply]`,
      );
  }
  if (opts.vault !== undefined && !opts.vault) fail("--vault expects a name");
  return opts;
}

async function vercel(path) {
  const token = process.env.LBT_SYNC_VERCEL_TOKEN;
  if (!token || token.startsWith("pass://"))
    fail(
      "No Vercel token: LBT_SYNC_VERCEL_TOKEN (env/sync.env) was not resolved.",
    );
  const url = new URL(`https://api.vercel.com${path}`);
  url.searchParams.set("teamId", config.vercelTeamId);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await response.json().catch(() => ({}));
  // Report Vercel's error code only; never a body that might echo a value.
  if (!response.ok)
    fail(`Vercel ${response.status} ${json.error?.code ?? ""}`.trim());
  return json;
}

/** Reads one line from the terminal without echoing it. */
function askHidden(question) {
  const fd = openSync("/dev/tty", "r+");
  const stty = (mode) =>
    spawnSync("stty", [mode], { stdio: [fd, "ignore", "ignore"] });
  stty("-echo");
  try {
    writeSync(fd, question);
    const chunks = [];
    const buffer = Buffer.alloc(4096);
    for (;;) {
      const n = readSync(fd, buffer, 0, buffer.length, null);
      if (n <= 0) break;
      chunks.push(Buffer.from(buffer.subarray(0, n)));
      if (buffer.subarray(0, n).includes(10)) break;
    }
    return Buffer.concat(chunks)
      .toString("utf8")
      .split("\n")[0]
      .replace(/\r$/, "");
  } finally {
    stty("echo");
    writeSync(fd, "\n");
    closeSync(fd);
  }
}
