#!/usr/bin/env node
// npm run env:push -- <target|group>... [--apply] [--prod] [--force]
//
// Runs on the owner's Mac, signed in with `pass-cli login`. For each target it starts
// scripts/env/push.mjs under `pass-cli run`, which resolves the template's pass://
// references into the push's environment: no value is ever written to a file.
//
// Groups: dev (website.dev, admin.dev), production (website.production,
// admin.production), github (github.repo, github.app-store, github.play-store).

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ENV_DIR, ROOT, loadTargets } from "./lib.mjs";

const config = loadTargets();
const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const names = args.filter((a) => !a.startsWith("--"));

const GROUPS = {
  dev: ["website.dev", "admin.dev"],
  production: ["website.production", "admin.production"],
  github: ["github.repo", "github.app-store", "github.play-store"],
};
const targets = [...new Set(names.flatMap((n) => GROUPS[n] ?? [n]))];
const unknown = targets.filter((t) => !config.targets[t]);
const badFlags = flags.filter(
  (f) => !["--apply", "--prod", "--force"].includes(f),
);

if (!targets.length || unknown.length || badFlags.length) {
  if (unknown.length) console.error(`Unknown target: ${unknown.join(", ")}`);
  if (badFlags.length) console.error(`Unknown option: ${badFlags.join(", ")}`);
  console.error(
    `Usage: npm run env:push -- <target|group>... [--apply] [--prod] [--force]\n` +
      `Targets: ${Object.keys(config.targets).join(", ")}\nGroups: ${Object.keys(GROUPS).join(", ")}`,
  );
  process.exit(2);
}

// The templates must be valid before anything resolves a secret.
const check = spawnSync(
  process.execPath,
  [join(ROOT, "scripts", "env", "check.mjs")],
  { stdio: "inherit" },
);
if (check.status !== 0) process.exit(check.status ?? 1);

const version = spawnSync("pass-cli", ["--version"], { encoding: "utf8" });
if (version.error?.code === "ENOENT") {
  console.error(
    "pass-cli is not installed: see env/README.md, then run pass-cli login.",
  );
  process.exit(1);
}
const installed = /(\d+\.\d+\.\d+)/.exec(version.stdout ?? "")?.[1];
if (installed !== config.passCliVersion) {
  console.warn(
    `warning  pass-cli ${installed ?? "(unknown version)"} is installed; this script was written for ${config.passCliVersion}. Proton can change the CLI in patch releases: read the dry run carefully.`,
  );
}

for (const target of targets) {
  const run = spawnSync(
    "pass-cli",
    [
      "run",
      "--env-file",
      join(ENV_DIR, "sync.env"),
      "--env-file",
      join(ENV_DIR, `${target}.env`),
      "--",
      process.execPath,
      join(ROOT, "scripts", "env", "push.mjs"),
      target,
      ...flags,
    ],
    { stdio: "inherit", cwd: ROOT },
  );
  if (run.status !== 0) {
    console.error(
      `\n${target} stopped (exit ${run.status ?? run.signal}). If pass-cli reported a sign-in problem, run pass-cli login.`,
    );
    process.exit(run.status || 1);
  }
}
