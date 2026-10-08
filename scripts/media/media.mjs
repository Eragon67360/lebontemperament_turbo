#!/usr/bin/env node
// Media out of git (#344): builds the manifest, uploads the files to the
// Supabase Storage bucket `site-media`, and checks the result.
//
//   node scripts/media/media.mjs manifest [--commit <sha>]   rebuild the manifest from git (no network)
//   node scripts/media/media.mjs upload [--apply] [--env-file <path>]
//   node scripts/media/media.mjs verify                       HEAD every public URL (read-only)
//   node scripts/media/media.mjs redirects <siteUrl>          follow every old URL on a deployed site (read-only)
//
// `upload` is a dry run unless `--apply` is given. It reads the files from the
// git history (manifest.sourceCommit), so it works from any clone, before or
// after the files leave the tree, and checks each file's SHA-256 first.
// Uploading writes to the PRODUCTION Supabase project: see docs/agents/media.md.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const manifestPath = path.join(root, "apps/website/lib/mediaManifest.json");
const PUBLIC_DIR = "apps/website/public";
const DIRS = ["music", "pdf", "videos"];
// Small enough to stay in the repo: next/image optimizes it from the local tree.
const KEEP_IN_REPO = new Set(["music/BT - Album/bt_20ans_pochette.jpg"]);
const CONTENT_TYPES = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};
const BUCKET = "site-media";
const PROJECT_REF = "fsklunxplbbtzgurwqmc";
const CACHE_CONTROL = "max-age=31536000"; // one year: files never change under the same key

const args = process.argv.slice(2);
const command = args[0];
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const has = (name) => args.includes(name);

/** ASCII-only object key: Supabase Storage rejects or mangles some characters. */
export function slugKey(relPath) {
  return relPath
    .split("/")
    .map((segment) =>
      segment
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/['’]/g, "")
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .join("/");
}

const git = (...gitArgs) =>
  execFileSync("git", gitArgs, { cwd: root, maxBuffer: 256 * 1024 * 1024 });

function buildManifest() {
  const commit = (flag("--commit") ?? "").trim();
  if (!commit)
    throw new Error(
      "manifest needs --commit <sha> (the commit that still holds the files)",
    );
  const sha = git("rev-parse", "--verify", `${commit}^{commit}`)
    .toString()
    .trim();
  const listing = git(
    "ls-tree",
    "-r",
    "-z",
    "--long",
    sha,
    "--",
    ...DIRS.map((d) => `${PUBLIC_DIR}/${d}`),
  )
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  const files = [];
  for (const line of listing) {
    const [meta, fullPath] = line.split("\t");
    const size = Number(meta.trim().split(/\s+/)[3]);
    const rel = fullPath.slice(PUBLIC_DIR.length + 1);
    if (KEEP_IN_REPO.has(rel)) continue;
    const ext = path.extname(rel).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) throw new Error(`No content type for ${rel}`);
    const data = git("cat-file", "blob", `${sha}:${fullPath}`);
    files.push({
      path: rel,
      key: slugKey(rel),
      size,
      sha256: createHash("sha256").update(data).digest("hex"),
      contentType,
    });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const keys = new Set(files.map((f) => f.key));
  if (keys.size !== files.length)
    throw new Error("Two files share one object key");
  const manifest = {
    bucket: BUCKET,
    baseUrl: `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET}`,
    sourceCommit: sha,
    files,
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const total = files.reduce((n, f) => n + f.size, 0);
  console.log(
    `Manifest: ${files.length} files, ${(total / 1e6).toFixed(1)} MB, source ${sha}`,
  );
}

const readManifest = () => JSON.parse(readFileSync(manifestPath, "utf8"));
const publicUrl = (m, f) =>
  `${m.baseUrl}/${f.key.split("/").map(encodeURIComponent).join("/")}`;

async function upload() {
  const m = readManifest();
  if (has("--env-file")) process.loadEnvFile(flag("--env-file"));
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  ).replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const apply = has("--apply");
  const target = new URL(m.baseUrl).origin;
  if (!url || !key)
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or pass --env-file)",
    );
  if (new URL(url).origin !== target && !has("--allow-other-project")) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is ${new URL(url).host}, the manifest targets ${new URL(target).host}. Refusing (use --allow-other-project to test on staging).`,
    );
  }
  const headers = { apikey: key };
  if (key.includes(".")) headers.Authorization = `Bearer ${key}`; // legacy JWT keys; sb_secret_ keys go in apikey only

  console.log(
    `${apply ? "UPLOAD" : "DRY RUN"} to ${new URL(url).host}, bucket ${m.bucket}, ${m.files.length} files`,
  );

  if (apply) {
    const res = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: m.bucket,
        name: m.bucket,
        public: true,
        file_size_limit: 50 * 1024 * 1024,
        allowed_mime_types: [...new Set(m.files.map((f) => f.contentType))],
      }),
    });
    const text = await res.text();
    if (res.ok) console.log(`Bucket ${m.bucket} created`);
    else if (res.status === 409 || /already exists|Duplicate/i.test(text))
      console.log(`Bucket ${m.bucket} already exists`);
    else throw new Error(`Bucket creation failed: ${res.status} ${text}`);
  }

  let uploaded = 0,
    skipped = 0;
  for (const f of m.files) {
    const head = await fetch(
      publicUrl({ baseUrl: `${url}/storage/v1/object/public/${m.bucket}` }, f),
      { method: "HEAD" },
    );
    if (head.ok && Number(head.headers.get("content-length")) === f.size) {
      skipped++;
      continue;
    }
    const data = git(
      "cat-file",
      "blob",
      `${m.sourceCommit}:${PUBLIC_DIR}/${f.path}`,
    );
    if (createHash("sha256").update(data).digest("hex") !== f.sha256)
      throw new Error(`Checksum mismatch for ${f.path}`);
    if (!apply) {
      console.log(`  would upload ${f.key} (${(f.size / 1e6).toFixed(1)} MB)`);
      continue;
    }
    const res = await fetch(
      `${url}/storage/v1/object/${m.bucket}/${f.key.split("/").map(encodeURIComponent).join("/")}`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": f.contentType,
          "Cache-Control": CACHE_CONTROL,
          "x-upsert": "true",
        },
        body: data,
      },
    );
    if (!res.ok)
      throw new Error(
        `Upload failed for ${f.key}: ${res.status} ${await res.text()}`,
      );
    uploaded++;
    console.log(`  uploaded ${f.key}`);
  }
  console.log(
    `${apply ? "Uploaded" : "Would upload"} ${apply ? uploaded : m.files.length - skipped}, already there ${skipped}`,
  );
  if (apply) console.log("Now run: node scripts/media/media.mjs verify");
}

async function verify() {
  const m = readManifest();
  let bad = 0;
  for (const f of m.files) {
    const res = await fetch(publicUrl(m, f), { method: "HEAD" });
    const ok =
      res.status === 200 &&
      Number(res.headers.get("content-length")) === f.size &&
      (res.headers.get("content-type") ?? "").startsWith(f.contentType);
    if (!ok) {
      bad++;
      console.log(
        `FAIL ${f.key}: ${res.status} ${res.headers.get("content-length")} ${res.headers.get("content-type")}`,
      );
    }
  }
  console.log(
    bad
      ? `${bad} of ${m.files.length} files are wrong or missing`
      : `OK: all ${m.files.length} files are served with the right size and type`,
  );
  process.exitCode = bad ? 1 : 0;
}

async function redirects() {
  const site = (args[1] ?? "").replace(/\/$/, "");
  if (!site)
    throw new Error(
      "Usage: redirects <siteUrl>, for example https://dev.lebontemperament.com",
    );
  const m = readManifest();
  let bad = 0;
  for (const f of m.files) {
    const old = `${site}/${f.path.split("/").map(encodeURIComponent).join("/")}`;
    const hop = await fetch(old, { method: "HEAD", redirect: "manual" });
    const location = hop.headers.get("location") ?? "";
    const final = await fetch(old, { method: "HEAD" });
    const ok =
      hop.status === 308 &&
      location === publicUrl(m, f) &&
      final.status === 200 &&
      Number(final.headers.get("content-length")) === f.size;
    if (!ok) {
      bad++;
      console.log(
        `FAIL ${f.path}: first hop ${hop.status} -> ${location}, final ${final.status}`,
      );
    }
  }
  console.log(
    bad
      ? `${bad} of ${m.files.length} old URLs are wrong`
      : `OK: all ${m.files.length} old URLs redirect and return 200`,
  );
  process.exitCode = bad ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const run = { manifest: buildManifest, upload, verify, redirects }[command];
  if (!run) {
    console.error(
      "Usage: media.mjs manifest --commit <sha> | upload [--apply] [--env-file f] | verify | redirects <siteUrl>",
    );
    process.exit(2);
  }
  await run();
}
