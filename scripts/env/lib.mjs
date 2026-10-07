// Shared helpers for the env/ templates: parsing, validation and the push plans.
// Nothing in this file reads a secret value from disk or prints one.

import { createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ENV_DIR = join(ROOT, "env");

const NAME_RE = /^[A-Z][A-Z0-9_]*$/;
// pass://<vault>/<item>/<field>; none of the three parts may contain a slash.
const REF_RE = /^pass:\/\/([^/]+)\/([^/]+)\/([^/]+)$/;

export function loadTargets() {
  return JSON.parse(readFileSync(join(ENV_DIR, "targets.json"), "utf8"));
}

export function templatePath(target) {
  return join(ENV_DIR, `${target}.env`);
}

/** Parses a template: KEY=pass://vault/item/field lines, blank lines and # comments. */
export function parseTemplate(text, file = "template") {
  const entries = [];
  const errors = [];
  const seen = new Set();
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    const where = `${file}:${index + 1}`;
    if (!line || line.startsWith("#")) return;
    const eq = line.indexOf("=");
    if (eq < 1) {
      errors.push(`${where}: expected NAME=pass://vault/item/field`);
      return;
    }
    const name = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!NAME_RE.test(name)) {
      errors.push(`${where}: "${name}" is not a valid variable name`);
      return;
    }
    if (seen.has(name)) {
      errors.push(`${where}: ${name} is listed twice`);
      return;
    }
    seen.add(name);
    const match = REF_RE.exec(value);
    if (!match) {
      // Never echo the value: if someone pasted a secret here, it must not reach a log.
      errors.push(
        `${where}: ${name} must be a pass://vault/item/field reference (values never go in this file)`,
      );
      return;
    }
    const [, vault, item, field] = match.map((part) => part.trim());
    entries.push({ name, vault, item, field, line: index + 1 });
  });
  return { entries, errors };
}

export function readTemplate(target) {
  const file = templatePath(target);
  return parseTemplate(readFileSync(file, "utf8"), relative(ROOT, file));
}

/** Checks one target's config and entries against the vault rules. */
export function validateTarget(target, config, entries, rules) {
  const errors = [];
  if (!["vercel", "github"].includes(config.kind)) {
    errors.push(`${target}: unknown kind "${config.kind}"`);
  }
  if (config.kind === "vercel") {
    if (!config.project) errors.push(`${target}: missing Vercel project`);
    const allowed = ["production", "preview", "development"];
    if (
      !config.environments?.length ||
      config.environments.some((e) => !allowed.includes(e))
    ) {
      errors.push(
        `${target}: environments must be some of ${allowed.join(", ")}`,
      );
    }
    if (config.production !== config.environments?.includes("production")) {
      errors.push(
        `${target}: "production" must be true exactly when it targets Production`,
      );
    }
  }
  const vaults = [rules.productionVault, rules.stagingVault];
  for (const entry of entries) {
    const at = `${target}: ${entry.name}`;
    if (!vaults.includes(entry.vault)) {
      errors.push(
        `${at} points at vault "${entry.vault}", expected one of ${vaults.join(", ")}`,
      );
      continue;
    }
    if (config.production && entry.vault === rules.stagingVault) {
      if (!config.allowStagingItems?.includes(entry.item)) {
        errors.push(
          `${at} is a production target but reads ${rules.stagingVault}/${entry.item}`,
        );
      }
    }
    if (
      !config.production &&
      entry.vault === rules.productionVault &&
      rules.productionOnlyItems.includes(entry.item)
    ) {
      errors.push(
        `${at} is a staging target but reads ${rules.productionVault}/${entry.item}`,
      );
    }
  }
  return errors;
}

/** Every pass:// reference used by a set of templates, grouped as vault -> item -> fields. */
export function itemsNeeded(entryLists) {
  const items = new Map();
  for (const entries of entryLists) {
    for (const { vault, item, field } of entries) {
      const key = `${vault} / ${item}`;
      if (!items.has(key)) items.set(key, new Set());
      items.get(key).add(field);
    }
  }
  return new Map([...items.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

// Variables the platforms or tooling set themselves; never expected in a template.
const PROVIDED = new Set([
  "NODE_ENV",
  "CI",
  "VERCEL_ENV",
  "VERCEL_URL",
  "NEXT_RUNTIME",
  "ANALYZE",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
]);

/** Names read through process.env.NAME in the source files under the given directories. */
export function scanCodeNames(dirs) {
  const names = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (
        /\.(ts|tsx|js|mjs)$/.test(entry.name) &&
        !/\.test\.|\.spec\./.test(entry.name)
      ) {
        for (const match of readFileSync(path, "utf8").matchAll(
          /process\.env\.([A-Z][A-Z0-9_]*)/g,
        )) {
          if (!PROVIDED.has(match[1])) names.add(match[1]);
        }
      }
    }
  };
  for (const dir of dirs) walk(join(ROOT, dir));
  return names;
}

/** Names read through secrets.NAME in the GitHub workflows. */
export function scanWorkflowSecrets() {
  const dir = join(ROOT, ".github", "workflows");
  const names = new Set();
  for (const file of readdirSync(dir)) {
    if (!/\.ya?ml$/.test(file)) continue;
    for (const match of readFileSync(join(dir, file), "utf8").matchAll(
      /secrets\.([A-Z][A-Z0-9_]*)/g,
    )) {
      if (match[1] !== "GITHUB_TOKEN") names.add(match[1]);
    }
  }
  return names;
}

/** Keyed fingerprint of a pushed value, so a later run can tell "changed" without storing it. */
export function fingerprint(key, target, name, value) {
  return createHmac("sha256", key)
    .update(`${target}\0${name}\0${value}`)
    .digest("hex");
}

function sameSet(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/**
 * Plans a push to one Vercel project and set of environments. Pure: `existing` is
 * Vercel's variable list (only key, id, target, gitBranch, type are used), `values`
 * maps name -> value, `known` maps name -> fingerprint of the last pushed value.
 * Returns one action per template name, plus the names found only in Vercel.
 */
export function planVercel({
  entries,
  existing,
  environments,
  values,
  known,
  fingerprintOf,
  force,
}) {
  const actions = [];
  for (const { name } of entries) {
    const matches = existing.filter(
      (env) =>
        env.key === name &&
        !env.gitBranch &&
        !env.customEnvironmentIds?.length &&
        (env.target ?? []).some((t) => environments.includes(t)),
    );
    const fp = fingerprintOf(name, values[name]);
    if (matches.length === 0) {
      actions.push({ name, action: "create", fp });
    } else if (matches.length > 1) {
      actions.push({
        name,
        action: "conflict",
        reason: "several Vercel variables match",
      });
    } else {
      const [env] = matches;
      const targets = env.target ?? [];
      if (sameSet(targets, environments)) {
        if (!force && known[name] === fp)
          actions.push({ name, action: "unchanged", fp });
        else if (known[name])
          actions.push({ name, action: "update", id: env.id, fp });
        else actions.push({ name, action: "overwrite", id: env.id, fp });
      } else if (environments.every((t) => targets.includes(t))) {
        // One variable serves these environments and others: give ours their own copy.
        actions.push({
          name,
          action: "split",
          id: env.id,
          keep: targets.filter((t) => !environments.includes(t)),
          fp,
        });
      } else {
        actions.push({
          name,
          action: "conflict",
          reason: `the Vercel variable covers ${targets.join(", ")} only`,
        });
      }
    }
  }
  const listed = new Set(entries.map((e) => e.name));
  const extras = [
    ...new Set(
      existing
        .filter(
          (env) =>
            !listed.has(env.key) &&
            (env.target ?? []).some((t) => environments.includes(t)),
        )
        .map((env) => env.key),
    ),
  ].sort();
  return { actions, extras };
}

/** Plans a push of GitHub secrets (repository or one environment). Pure, like planVercel. */
export function planGithub({
  entries,
  existingNames,
  values,
  known,
  fingerprintOf,
  force,
}) {
  const existing = new Set(existingNames);
  const actions = entries.map(({ name }) => {
    const fp = fingerprintOf(name, values[name]);
    if (!existing.has(name)) return { name, action: "create", fp };
    if (!force && known[name] === fp) return { name, action: "unchanged", fp };
    return { name, action: known[name] ? "update" : "overwrite", fp };
  });
  const listed = new Set(entries.map((e) => e.name));
  const extras = existingNames.filter((n) => !listed.has(n)).sort();
  return { actions, extras };
}
