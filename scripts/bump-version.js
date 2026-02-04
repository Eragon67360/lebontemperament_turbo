#!/usr/bin/env node

/**
 * Unified version bumping script for the monorepo.
 * Single source of truth: version.json
 * Updates: version.json, apps/website, apps/admin, apps/mobile_app
 *
 * Usage: node scripts/bump-version.js <build|patch|minor|major>
 * - build: bump versionCode only (1.0.7+15 → 1.0.7+16)
 * - patch: bump patch + versionCode (1.0.7+15 → 1.0.8+16)
 * - minor: bump minor + versionCode (1.0.7+15 → 1.1.0+16)
 * - major: bump major + versionCode (1.0.7+15 → 2.0.0+16)
 *
 * Output: prints oldVersion then newVersion (last line is new version for scripts)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const VERSION_PATH = path.join(ROOT, "version.json");
const WEBSITE_PKG = path.join(ROOT, "apps/website/package.json");
const ADMIN_PKG = path.join(ROOT, "apps/admin/package.json");
const PUBSPEC_PATH = path.join(ROOT, "apps/mobile_app/pubspec.yaml");
const VERSION_REGEX = /^version:\s*(\d+)\.(\d+)\.(\d+)\+(\d+)\s*$/m;

function getCurrent() {
  const data = JSON.parse(fs.readFileSync(VERSION_PATH, "utf8"));
  const [major, minor, patch] = data.version.split(".").map(Number);
  return { major, minor, patch, build: data.build };
}

function bumpVersion(current, type) {
  const { major, minor, patch, build } = current;
  const newBuild = build + 1;

  switch (type) {
    case "build":
      return { major, minor, patch, build: newBuild };
    case "patch":
      return { major, minor, patch: patch + 1, build: newBuild };
    case "minor":
      return { major, minor: minor + 1, patch: 0, build: newBuild };
    case "major":
      return { major: major + 1, minor: 0, patch: 0, build: newBuild };
    default:
      throw new Error(
        `Invalid bump type: ${type}. Use build, patch, minor, or major.`
      );
  }
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function formatMobileVersion({ major, minor, patch, build }) {
  return `${major}.${minor}.${patch}+${build}`;
}

function hasAppChanges() {
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
  } catch {
    return true; // Not in git, assume changes
  }
  try {
    const staged = execSync("git diff --cached --name-only", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    const unstaged = execSync("git diff --name-only", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    const untracked = execSync(
      "git ls-files --others --exclude-standard apps/",
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    const all = [...new Set([...staged, ...unstaged, ...untracked])];
    const appPaths = ["apps/website/", "apps/admin/", "apps/mobile_app/"];
    return all.some((f) => appPaths.some((p) => f.startsWith(p)));
  } catch {
    return true;
  }
}

function main() {
  const args = process.argv.slice(2);
  const ifChanged = args.includes("--if-changed");
  const type = args.find((a) => !a.startsWith("--"));
  if (!type) {
    console.error(
      "Usage: node scripts/bump-version.js <build|patch|minor|major> [--if-changed]"
    );
    process.exit(1);
  }

  if (ifChanged && !hasAppChanges()) {
    process.exit(0); // No changes, skip bump
  }

  const current = getCurrent();
  const bumped = bumpVersion(current, type);

  const oldVersion = formatVersion(current);
  const newVersion = formatVersion(bumped);
  const oldMobile = formatMobileVersion(current);
  const newMobile = formatMobileVersion(bumped);

  // Write version.json
  fs.writeFileSync(
    VERSION_PATH,
    JSON.stringify({ version: newVersion, build: bumped.build }, null, 2) + "\n"
  );

  // Write website package.json
  const websitePkg = JSON.parse(fs.readFileSync(WEBSITE_PKG, "utf8"));
  websitePkg.version = newVersion;
  fs.writeFileSync(WEBSITE_PKG, JSON.stringify(websitePkg, null, 2) + "\n");

  // Write admin package.json
  const adminPkg = JSON.parse(fs.readFileSync(ADMIN_PKG, "utf8"));
  adminPkg.version = newVersion;
  fs.writeFileSync(ADMIN_PKG, JSON.stringify(adminPkg, null, 2) + "\n");

  // Write pubspec.yaml
  const pubspecContent = fs.readFileSync(PUBSPEC_PATH, "utf8");
  const newPubspec = pubspecContent.replace(
    VERSION_REGEX,
    `version: ${newMobile}`
  );
  fs.writeFileSync(PUBSPEC_PATH, newPubspec);

  // Update package-lock.json (workspace versions)
  try {
    execSync("npm install", { stdio: "ignore", cwd: ROOT });
  } catch (err) {
    console.warn(
      "npm install failed (package-lock may be stale):",
      err.message
    );
  }

  // Output for scripts (build-local.sh uses tail -1)
  console.log(oldMobile);
  console.log(newMobile);
}

main();
