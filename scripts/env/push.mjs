#!/usr/bin/env node
// Pushes one env/ target to Vercel or GitHub. Runs INSIDE `pass-cli run`, which puts
// the resolved values in this process's environment: start it with
// `npm run env:push -- <target>` (scripts/env/cli.mjs), never directly.
//
// Prints variable names only. Dry run unless --apply; production targets also need
// --prod and the target's name typed at the prompt.

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  fingerprint,
  loadTargets,
  planGithub,
  planVercel,
  readTemplate,
  validateTarget,
} from "./lib.mjs";

const [target, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
const force = flags.includes("--force");
const prodFlag = flags.includes("--prod");

const config = loadTargets();
const targetConfig = config.targets[target];
if (!targetConfig)
  fail(
    `Unknown target "${target}". Known: ${Object.keys(config.targets).join(", ")}`,
  );

const { entries, errors } = readTemplate(target);
errors.push(...validateTarget(target, targetConfig, entries, config.rules));
if (errors.length) fail(errors.join("\n"));

// pass-cli has resolved every reference by now; anything still looking like one wasn't.
const values = {};
for (const { name } of entries) {
  const value = process.env[name];
  if (!value || value.startsWith("pass://")) {
    fail(
      `${name} has no value: start this through "npm run env:push", which resolves it with pass-cli.`,
    );
  }
  values[name] = value;
}

const state = loadState();
const known = state.pushed[target] ?? {};
const fingerprintOf = (name, value) =>
  fingerprint(state.key, target, name, value);

const where =
  targetConfig.kind === "vercel"
    ? `Vercel ${targetConfig.project} (${targetConfig.environments.join(", ")})`
    : `GitHub ${config.githubRepo} ${targetConfig.environment ? `environment ${targetConfig.environment}` : "repository secrets"}`;
console.log(`\n${target} -> ${where}`);

const plan =
  targetConfig.kind === "vercel"
    ? planVercel({
        entries,
        existing: await vercelList(),
        environments: targetConfig.environments,
        values,
        known,
        fingerprintOf,
        force,
      })
    : planGithub({
        entries,
        existingNames: githubList(),
        values,
        known,
        fingerprintOf,
        force,
      });

const NOTES = {
  create: "new",
  update: "changed since the last push from this Mac",
  overwrite: "exists, never pushed from this Mac: will be overwritten",
  unchanged: "",
  split:
    "the variable also serves other environments: they keep the current value",
};
for (const a of plan.actions) {
  const note =
    a.action === "conflict"
      ? `${a.reason}: fix by hand, skipped`
      : a.action === "split"
        ? `${NOTES.split} (${a.keep.join(", ")})`
        : NOTES[a.action];
  console.log(`  ${a.action.padEnd(10)} ${a.name}${note ? `   ${note}` : ""}`);
}
for (const name of plan.extras)
  console.log(
    `  ${"extra".padEnd(10)} ${name}   only in the destination, left alone`,
  );

const writes = plan.actions.filter(
  (a) => !["unchanged", "conflict"].includes(a.action),
);
const conflicts = plan.actions.filter((a) => a.action === "conflict").length;

if (!apply) {
  console.log(
    `\nDry run: ${writes.length} to write, ${conflicts} conflicts. Nothing written; add --apply to write.`,
  );
  process.exit(conflicts ? 1 : 0);
}
if (writes.length === 0) {
  console.log("\nNothing to write.");
  process.exit(conflicts ? 1 : 0);
}
if (targetConfig.production) {
  if (!prodFlag)
    fail(`${target} is a production target: add --prod to write to it.`);
  const typed = ask(
    `\nThis writes ${writes.length} values to PRODUCTION. Type "${target}" to go on: `,
  );
  if (typed !== target) fail("Not confirmed: nothing written.");
}

let failed = 0;
for (const a of writes) {
  try {
    if (targetConfig.kind === "vercel") await vercelWrite(a);
    else githubWrite(a.name);
    known[a.name] = a.fp;
    console.log(`  written    ${a.name}`);
  } catch (error) {
    failed++;
    console.log(`  FAILED     ${a.name}   ${error.message}`);
  }
}
state.pushed[target] = known;
saveState(state);

console.log(
  `\n${writes.length - failed} written, ${failed} failed, ${conflicts} conflicts.`,
);
if (targetConfig.kind === "vercel" && writes.length > failed) {
  console.log(
    targetConfig.production
      ? "Vercel uses the new values from the next production build, i.e. the next release."
      : 'Vercel uses the new values from the next build: merge the next PR into dev with "[vercel deploy]" in its title (DEPLOYMENT.md).',
  );
}
process.exit(failed || conflicts ? 1 : 0);

// ---------------------------------------------------------------------------

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Reads one line from the terminal, even though stdin belongs to pass-cli. */
function ask(question) {
  const fd = openSync("/dev/tty", "r+");
  try {
    writeSync(fd, question);
    const buffer = Buffer.alloc(256);
    const n = readSync(fd, buffer, 0, buffer.length, null);
    return buffer.subarray(0, n).toString("utf8").trim();
  } finally {
    closeSync(fd);
  }
}

// Fingerprints of pushed values, keyed with a random local key, outside the repo.
function loadState() {
  const dir = join(homedir(), ".config", "lbt-env");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const keyFile = join(dir, "key");
  if (!existsSync(keyFile))
    writeFileSync(keyFile, randomBytes(32).toString("hex"), { mode: 0o600 });
  const stateFile = join(dir, "state.json");
  const pushed = existsSync(stateFile)
    ? JSON.parse(readFileSync(stateFile, "utf8"))
    : {};
  return { key: readFileSync(keyFile, "utf8").trim(), pushed, stateFile };
}

function saveState({ pushed, stateFile }) {
  writeFileSync(stateFile, `${JSON.stringify(pushed, null, 2)}\n`, {
    mode: 0o600,
  });
  chmodSync(stateFile, 0o600);
}

async function vercel(method, path, body) {
  const token = process.env.LBT_SYNC_VERCEL_TOKEN;
  if (!token || token.startsWith("pass://"))
    fail(
      "No Vercel token: LBT_SYNC_VERCEL_TOKEN (env/sync.env) was not resolved.",
    );
  const url = new URL(`https://api.vercel.com${path}`);
  url.searchParams.set("teamId", config.vercelTeamId);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  // Report Vercel's error code only; never a body that might echo a value.
  if (!response.ok)
    throw new Error(
      `Vercel ${response.status} ${json.error?.code ?? ""}`.trim(),
    );
  return json;
}

async function vercelList() {
  const project = encodeURIComponent(targetConfig.project);
  const { envs = [], pagination } = await vercel(
    "GET",
    `/v10/projects/${project}/env`,
  );
  if (pagination?.next)
    fail(
      "Vercel returned a partial list of variables; this script needs updating.",
    );
  // Keep only what the plan needs: the list can carry values, which must not linger.
  return envs.map(
    ({ id, key, target, gitBranch, type, customEnvironmentIds }) => ({
      id,
      key,
      target: [].concat(target ?? []),
      gitBranch,
      type,
      customEnvironmentIds,
    }),
  );
}

async function vercelWrite(a) {
  const project = encodeURIComponent(targetConfig.project);
  const value = values[a.name];
  if (a.action === "split") {
    await vercel("PATCH", `/v9/projects/${project}/env/${a.id}`, {
      target: a.keep,
    });
  }
  if (a.action === "create" || a.action === "split") {
    // Sensitive variables can't be read back, and Vercel refuses them on Development.
    const type = targetConfig.production ? "sensitive" : "encrypted";
    try {
      await vercel("POST", `/v10/projects/${project}/env`, {
        key: a.name,
        value,
        type,
        target: targetConfig.environments,
      });
    } catch (error) {
      // Give the environments back to the shared variable rather than leave them without one.
      if (a.action === "split") {
        await vercel("PATCH", `/v9/projects/${project}/env/${a.id}`, {
          target: [...a.keep, ...targetConfig.environments],
        });
      }
      throw error;
    }
  } else {
    await vercel("PATCH", `/v9/projects/${project}/env/${a.id}`, { value });
  }
}

function gh(args, input) {
  const result = spawnSync("gh", args, {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.error?.code === "ENOENT")
    fail(
      'The GitHub CLI "gh" is not installed: brew install gh, then gh auth login.',
    );
  if (result.status !== 0)
    throw new Error(
      `gh exited with ${result.status}: ${(result.stderr ?? "").trim().split("\n")[0]}`,
    );
  return result.stdout;
}

function githubScope() {
  return [
    "--repo",
    config.githubRepo,
    ...(targetConfig.environment ? ["--env", targetConfig.environment] : []),
  ];
}

function githubList() {
  try {
    return JSON.parse(
      gh(["secret", "list", ...githubScope(), "--json", "name"]),
    ).map((s) => s.name);
  } catch (error) {
    fail(
      `Could not list the GitHub secrets (${error.message}). Is "gh auth login" done?`,
    );
  }
}

function githubWrite(name) {
  // The value goes through standard input: gh encrypts it, and it never shows in `ps`.
  gh(["secret", "set", name, ...githubScope()], values[name]);
}
