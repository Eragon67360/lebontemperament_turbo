import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mediaRedirect, mediaUrlForPath } from "./media";
import manifest from "./mediaManifest.json";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicJson = (name: string) =>
  JSON.parse(
    readFileSync(path.join(here, "..", "public", "json", name), "utf8"),
  );

// Manifest: unique, ASCII-safe keys; one content type per extension.
const keys = manifest.files.map((f) => f.key);
assert.equal(new Set(keys).size, keys.length, "object keys are unique");
for (const f of manifest.files) {
  assert.match(f.key, /^[A-Za-z0-9._/-]+$/, `ASCII key: ${f.key}`);
  assert.match(f.sha256, /^[0-9a-f]{64}$/);
  assert.ok(f.size > 0);
}

const base = manifest.baseUrl;
const pochette = "music/BT - Album/bt_20ans_pochette.jpg";

// Lookup: exact, URL-decoded, trailing space (cds.json has some), case, NFD.
const track = manifest.files.find((f) => f.path.includes("Triste Espana"))!;
assert.equal(mediaUrlForPath(track.path), `${base}/${track.key}`);
assert.equal(mediaUrlForPath(`/${track.path} `), `${base}/${track.key}`);
assert.equal(mediaUrlForPath(track.path.toUpperCase()), `${base}/${track.key}`);
assert.equal(
  mediaUrlForPath(
    "music/BT - Album/01 - Le Bon Tempérament - 01. A l'enterrement d'une feuille morte. J. Prévert.mp3",
  )?.startsWith(base),
  true,
);
assert.equal(mediaUrlForPath("music/nope.mp3"), null);
assert.equal(mediaUrlForPath(pochette), null, "the cover stays in the repo");

// Everything the site and the app link to is in the bucket.
const listed: string[] = [];
for (const [json, folder] of [
  ["pdf_filesAG.json", "AG"],
  ["pdf_filesGazettes.json", "Gazettes"],
  ["pdf_filesPM.json", "PM"],
] as const) {
  for (const file of publicJson(json))
    listed.push(`pdf/${folder}/${file.name}`);
}
for (const file of publicJson("music_files_bt_album.json")) {
  const name = /\.(mp3|wav)$/i.test(file.name) ? file.name : `${file.name}.mp3`;
  listed.push(`music/BT - Album/${name}`);
}
for (const cd of publicJson("cds.json")) {
  for (const track of cd.tracks ?? []) {
    if (track.sampleUrl) listed.push(track.sampleUrl.replace(/^\//, ""));
  }
}
for (let i = 1; i <= 7; i++) listed.push(`videos/video${i}.mp4`);
listed.push(
  "pdf/reglement.pdf",
  "pdf/charte_BT.pdf",
  "pdf/Statuts_Le_Bon_Tempérament.pdf",
  "pdf/AG_2026/convocation_AG_2026.pdf",
  "pdf/AG_2026/procuration_AG_2026.pdf",
  "pdf/Programmes/Entre_Terre_et_Ciel_2025.pdf",
);
assert.ok(listed.length > 40);
// Tracks 16 to 27 are listed on the anniversary page but were never in git, so
// their URLs were already 404 before the move (#344). Nothing else may be missing.
const neverInGit = /^music\/BT - Album\/(1[6-9]|2\d) - /;
for (const p of listed) {
  if (neverInGit.test(p)) continue;
  assert.ok(mediaUrlForPath(p), `in the bucket: ${p}`);
}

// Redirect response.
const ok = mediaRedirect("music", ["roi-arthur", "06 Sous l'océan.wav "]);
assert.equal(ok.status, 308);
assert.equal(
  ok.headers.get("Location"),
  `${base}/music/roi-arthur/06-Sous-locean.wav`,
);
assert.match(ok.headers.get("Cache-Control") ?? "", /max-age=3600/);
assert.equal(mediaRedirect("pdf", ["missing.pdf"]).status, 404);

console.log("media.test.ts: ok");
