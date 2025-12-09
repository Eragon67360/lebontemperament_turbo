#!/usr/bin/env node

/**
 * Version bumping script for Turbo monorepo
 * Automatically bumps versions of @website and @admin based on git changes
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const APPS = {
  website: path.join(__dirname, "../apps/website/package.json"),
  admin: path.join(__dirname, "../apps/admin/package.json"),
};

/**
 * Get the current version from package.json
 */
function getCurrentVersion(packageJsonPath) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return pkg.version;
}

/**
 * Bump version based on type (major, minor, patch)
 */
function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

/**
 * Get changed files for a specific app
 */
function getChangedFiles(appName) {
  try {
    // Check if we're in a git repository
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
  } catch (error) {
    console.warn("Not a git repository, skipping version bump");
    return [];
  }

  try {
    // Get staged files
    let stagedFiles = [];
    try {
      stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch (error) {
      // No staged files, that's okay
    }

    // Get unstaged files (for when script runs before commit)
    let unstagedFiles = [];
    try {
      unstagedFiles = execSync("git diff --name-only", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch (error) {
      // No unstaged files, that's okay
    }

    // Also check files that are untracked (new files)
    let untrackedFiles = [];
    try {
      untrackedFiles = execSync(
        `git ls-files --others --exclude-standard apps/${appName}/`,
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }
      )
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch (error) {
      // No untracked files, that's okay
    }

    const allFiles = [
      ...new Set([...stagedFiles, ...unstagedFiles, ...untrackedFiles]),
    ];

    // Filter files for the specific app
    const appPath = `apps/${appName}/`;
    return allFiles.filter((file) => file.startsWith(appPath));
  } catch (error) {
    console.warn(`Could not get changed files for ${appName}:`, error.message);
    return [];
  }
}

/**
 * Determine version bump type based on changed files
 */
function determineBumpType(changedFiles) {
  if (changedFiles.length === 0) {
    return null; // No changes, no bump needed
  }

  // Check for breaking changes (major)
  const breakingPatterns = [
    /api\/.*\/route\.ts$/, // API route changes
    /next\.config\./, // Next.js config changes
    /package\.json$/, // Dependency changes (could be breaking)
  ];

  const hasBreaking = changedFiles.some((file) =>
    breakingPatterns.some((pattern) => pattern.test(file))
  );

  if (hasBreaking) {
    // Check if it's actually a breaking change by looking at the diff
    // For now, we'll be conservative and use minor for API changes
    // You can enhance this to analyze the actual changes
    return "minor";
  }

  // Check for new features (minor)
  const featurePatterns = [
    /app\/.*\/page\.tsx$/, // New pages
    /components\/.*\.tsx$/, // New components
    /^apps\/[^/]+\/app\/api\/.*\/route\.ts$/, // New API routes
  ];

  const hasFeatures = changedFiles.some((file) =>
    featurePatterns.some((pattern) => pattern.test(file))
  );

  if (hasFeatures) {
    return "minor";
  }

  // Default to patch for bug fixes, refactoring, etc.
  return "patch";
}

/**
 * Update version in package.json
 */
function updateVersion(packageJsonPath, newVersion) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const oldVersion = pkg.version;
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  return oldVersion;
}

/**
 * Main function
 */
function main() {
  const bumpTypeArg = process.argv[2]; // Optional: 'major', 'minor', 'patch'

  console.log("🚀 Bumping versions for changed apps...\n");

  let hasChanges = false;

  for (const [appName, packageJsonPath] of Object.entries(APPS)) {
    const changedFiles = getChangedFiles(appName);

    if (changedFiles.length === 0) {
      console.log(`⏭️  ${appName}: No changes detected, skipping version bump`);
      continue;
    }

    const currentVersion = getCurrentVersion(packageJsonPath);
    const bumpType = bumpTypeArg || determineBumpType(changedFiles);

    if (!bumpType) {
      console.log(`⏭️  ${appName}: Could not determine bump type, skipping`);
      continue;
    }

    const newVersion = bumpVersion(currentVersion, bumpType);
    const oldVersion = updateVersion(packageJsonPath, newVersion);

    console.log(`✅ ${appName}: ${oldVersion} → ${newVersion} (${bumpType})`);
    console.log(`   Changed files: ${changedFiles.length}`);

    hasChanges = true;
  }

  if (hasChanges) {
    console.log("\n📦 Running npm install to update package-lock.json...");
    try {
      execSync("npm install", {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });
      console.log("✅ package-lock.json updated successfully!");
    } catch (error) {
      console.error("❌ Failed to run npm install:", error.message);
      process.exit(1);
    }
    console.log(
      "\n📝 Version bumps completed! Don't forget to commit the updated package.json and package-lock.json files."
    );
  } else {
    console.log("\n✨ No version bumps needed.");
  }
}

main();
