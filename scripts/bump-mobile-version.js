#!/usr/bin/env node

/**
 * Bump version in apps/mobile_app/pubspec.yaml.
 * Flutter format: version: x.y.z+b (versionName + versionCode).
 * Usage: node scripts/bump-mobile-version.js <build|patch|minor|major>
 * - build: bump versionCode only (1.0.0+2 → 1.0.0+3)
 * - patch: bump patch + versionCode (1.0.0+3 → 1.0.1+4)
 * - minor: bump minor + versionCode (1.0.1+4 → 1.1.0+5)
 * - major: bump major + versionCode (1.1.0+5 → 2.0.0+6)
 */

const fs = require("fs");
const path = require("path");

const PUBSPEC_PATH = path.join(__dirname, "../apps/mobile_app/pubspec.yaml");
const VERSION_REGEX = /^version:\s*(\d+)\.(\d+)\.(\d+)\+(\d+)\s*$/m;

function getCurrentVersion(content) {
  const match = content.match(VERSION_REGEX);
  if (!match) {
    throw new Error(
      "Could not parse version from pubspec.yaml (expected format: version: x.y.z+b)"
    );
  }
  const [, major, minor, patch, build] = match.map(Number);
  return { major, minor, patch, build };
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

function formatVersion({ major, minor, patch, build }) {
  return `${major}.${minor}.${patch}+${build}`;
}

function main() {
  const type = process.argv[2];
  if (!type) {
    console.error("Usage: node scripts/bump-mobile-version.js <build|patch|minor|major>");
    process.exit(1);
  }

  const content = fs.readFileSync(PUBSPEC_PATH, "utf8");
  const current = getCurrentVersion(content);
  const bumped = bumpVersion(current, type);

  const oldVersion = formatVersion(current);
  const newVersion = formatVersion(bumped);

  const newContent = content.replace(
    VERSION_REGEX,
    `version: ${newVersion}`
  );
  fs.writeFileSync(PUBSPEC_PATH, newContent);

  console.log(oldVersion);
  console.log(newVersion);
}

main();
