#!/usr/bin/env node
// Offline check of the env/ templates: syntax, vault rules, and drift against the
// names the code and workflows read, and of turbo.json's env lists against the
// same names. Needs no Proton Pass, no token, no network.
//
//   npm run env:check            errors fail (syntax, vault rules, a name
//                                turbo.json hides from its task), drift is a warning
//   npm run env:check -- --items lists the Proton Pass items and fields to create

import { existsSync } from "node:fs";
import {
  itemsNeeded,
  loadTargets,
  loadTurbo,
  readTemplate,
  scanCodeNames,
  scanWorkflowSecrets,
  templatePath,
  turboDrift,
  validateTarget,
} from "./lib.mjs";

const config = loadTargets();
const errors = [];
const warnings = [];
const parsed = {};

for (const [target, targetConfig] of Object.entries(config.targets)) {
  if (!existsSync(templatePath(target))) {
    errors.push(`${target}: env/${target}.env is missing`);
    continue;
  }
  const { entries, errors: parseErrors } = readTemplate(target);
  parsed[target] = entries;
  errors.push(...parseErrors);
  errors.push(...validateTarget(target, targetConfig, entries, config.rules));

  if (targetConfig.scan) {
    const used = scanCodeNames(targetConfig.scan);
    const listed = new Set(entries.map((e) => e.name));
    for (const name of [...listed].filter((n) => !used.has(n)).sort()) {
      warnings.push(
        `${target}: ${name} is in the template but no code under ${targetConfig.scan} reads it`,
      );
    }
    for (const name of [...used]
      .filter((n) => !listed.has(n) && !config.unmanaged?.[n])
      .sort()) {
      warnings.push(
        `${target}: the code reads ${name}, which the template doesn't set`,
      );
    }
  }
}

const everyName = new Set(
  Object.values(parsed)
    .flat()
    .map((e) => e.name),
);
for (const name of Object.keys(config.optional ?? {})) {
  if (!everyName.has(name))
    errors.push(`targets.json: optional ${name} is in no template`);
}

const sync = readTemplate("sync");
errors.push(...sync.errors);

const githubTargets = Object.keys(config.targets).filter(
  (t) => config.targets[t].kind === "github",
);
const githubListed = new Set(
  githubTargets.flatMap((t) => (parsed[t] ?? []).map((e) => e.name)),
);
const workflowSecrets = scanWorkflowSecrets();
for (const name of [...workflowSecrets]
  .filter((n) => !githubListed.has(n))
  .sort()) {
  warnings.push(
    `github: a workflow reads secrets.${name}, which no github.* template sets`,
  );
}
for (const name of [...githubListed]
  .filter((n) => !workflowSecrets.has(n))
  .sort()) {
  warnings.push(
    `github: ${name} is in a github.* template but no workflow reads it`,
  );
}

// turbo.json: Turbo's strict env mode hides every name a task doesn't declare
// (apart from NEXT_PUBLIC_* and the CI vendor's own variables), so a name the
// code reads must be declared or the task silently runs without it, which is
// an error. A declared name nobody reads is only noise, and a cache key for
// nothing: a warning. The directories are the code each task runs.
const TURBO_TASKS = {
  build: ["apps/website", "apps/admin", "packages"],
  "test:e2e": ["apps/e2e"],
};
const turbo = loadTurbo();
for (const [task, dirs] of Object.entries(TURBO_TASKS)) {
  const { undeclared, unused } = turboDrift(turbo, task, scanCodeNames(dirs));
  for (const name of undeclared) {
    errors.push(
      `turbo.json: the code reads ${name}, which task "${task}" doesn't declare (strict env mode hides it)`,
    );
  }
  for (const name of unused) {
    warnings.push(
      `turbo.json: task "${task}" declares ${name}, which no code under ${dirs.join(", ")} reads`,
    );
  }
}

if (process.argv.includes("--items")) {
  console.log("Proton Pass items and fields the templates read:\n");
  for (const [item, fields] of itemsNeeded([
    ...Object.values(parsed),
    sync.entries,
  ])) {
    console.log(`  ${item}: ${[...fields].sort().join(", ")}`);
  }
  console.log("");
}

for (const warning of warnings) console.log(`warning  ${warning}`);
for (const error of errors) console.log(`error    ${error}`);
const count = Object.values(parsed).reduce(
  (n, entries) => n + entries.length,
  0,
);
console.log(
  `\n${Object.keys(parsed).length} templates, ${count} variables: ${errors.length} errors, ${warnings.length} warnings.`,
);
process.exit(errors.length ? 1 : 0);
