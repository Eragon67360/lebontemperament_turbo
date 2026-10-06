import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MB } from "./uploads";
import {
  checkWorkFile,
  STORAGE_REMOVE_BATCH,
  storagePathBatches,
  storageSafeName,
  WORK_FILE_ACCEPT,
  WORK_FILE_MAX_BYTES,
  WORK_FILE_TYPES,
  workFileContentType,
  workFileStoragePath,
} from "./workFiles";

// --- Folder delete: the paths come from the rows, not from a folder prefix (#439)

assert.deepEqual(storagePathBatches([]), []);
assert.deepEqual(
  storagePathBatches([
    { storage_path: "p1/g1/1700000000000_a.pdf" },
    { storage_path: "p1/g1/1700000000001_b.mp3" },
  ]),
  [["p1/g1/1700000000000_a.pdf", "p1/g1/1700000000001_b.mp3"]],
);
// Blanks and duplicates are dropped (a duplicate would fail the whole batch
// on some Storage versions, a blank would target the bucket root).
assert.deepEqual(
  storagePathBatches([
    { storage_path: "p/g/1_a.pdf" },
    { storage_path: "p/g/1_a.pdf" },
    { storage_path: "" },
    { storage_path: "   " },
    { storage_path: null },
  ]),
  [["p/g/1_a.pdf"]],
);
// Batches of at most 1,000 (Storage's limit per request).
{
  const many = Array.from({ length: 2001 }, (_, i) => ({
    storage_path: `p/g/${i}_f.pdf`,
  }));
  const batches = storagePathBatches(many);
  assert.equal(STORAGE_REMOVE_BATCH, 1000);
  assert.deepEqual(
    batches.map((batch) => batch.length),
    [1000, 1000, 1],
  );
  assert.equal(batches.flat().length, 2001);
}
assert.deepEqual(
  storagePathBatches(
    [{ storage_path: "a" }, { storage_path: "b" }, { storage_path: "c" }],
    2,
  ),
  [["a", "b"], ["c"]],
);

// --- Upload paths

assert.equal(
  workFileStoragePath("prog", "grp", "Partition.pdf", 1700000000000),
  "prog/grp/1700000000000_Partition.pdf",
);
// Storage refuses accents and most punctuation in keys.
assert.equal(
  storageSafeName("Répétition n°2 (alto).pdf"),
  "Repetition_n_2_alto_.pdf",
);
assert.equal(
  storageSafeName("Ave Maria – Caccini.mp3"),
  "Ave_Maria_Caccini.mp3",
);
assert.equal(storageSafeName("../../etc/passwd"), "etc_passwd");
assert.equal(storageSafeName("あいう"), "fichier");
assert.equal(storageSafeName(""), "fichier");
assert.ok(storageSafeName(`${"a".repeat(300)}.pdf`).length <= 120);
assert.ok(storageSafeName(`${"a".repeat(300)}.pdf`).endsWith(".pdf"));
assert.match(storageSafeName("Œuvre à l'été.docx"), /^[A-Za-z0-9._-]+$/);

// --- Content type

const named = (name: string, type: string) => ({ name, type });
assert.equal(
  workFileContentType(named("a.pdf", "application/pdf")),
  "application/pdf",
);
assert.equal(
  workFileContentType(named("a.PDF", "Application/PDF; charset=binary")),
  "application/pdf",
);
// Browsers send no type, or a generic one, for scores and MIDI files.
assert.equal(workFileContentType(named("chœur.mid", "")), "audio/midi");
assert.equal(
  workFileContentType(named("score.mxl", "application/octet-stream")),
  "application/vnd.recordare.musicxml",
);
assert.equal(
  workFileContentType(named("score.musicxml", "")),
  "application/vnd.recordare.musicxml+xml",
);
assert.equal(workFileContentType(named("scan.HEIC", "")), "image/heic");
// A declared type outside the list is refused, whatever the extension says.
assert.equal(workFileContentType(named("x.pdf", "image/svg+xml")), null);
assert.equal(workFileContentType(named("x.svg", "image/svg+xml")), null);
assert.equal(workFileContentType(named("x.html", "text/html")), null);
assert.equal(workFileContentType(named("x.xml", "text/xml")), null);
assert.equal(workFileContentType(named("x.svg", "")), null);
assert.equal(workFileContentType(named("x.exe", "")), null);
assert.equal(workFileContentType(named("noextension", "")), null);
assert.equal(workFileContentType(named(".pdf", "")), null);
// Every extension the picker offers maps to an allowed type.
for (const extension of WORK_FILE_ACCEPT.split(",")) {
  const type = workFileContentType(named(`f${extension}`, ""));
  assert.ok(type && Object.hasOwn(WORK_FILE_TYPES, type), extension);
}

// --- Size and type check

assert.equal(WORK_FILE_MAX_BYTES, 50 * MB);
assert.deepEqual(
  checkWorkFile({ name: "a.pdf", type: "application/pdf", size: 1000 }),
  { ok: true, contentType: "application/pdf" },
);
assert.deepEqual(
  checkWorkFile({ name: "a.pdf", type: "application/pdf", size: 50 * MB }),
  { ok: true, contentType: "application/pdf" },
);
{
  const tooBig = checkWorkFile({
    name: "a.wav",
    type: "audio/wav",
    size: 50 * MB + 1,
  });
  assert.equal(tooBig.ok, false);
  assert.match(!tooBig.ok ? tooBig.error : "", /50 Mo/);
}
assert.equal(
  checkWorkFile({ name: "a.pdf", type: "application/pdf", size: 0 }).ok,
  false,
);
assert.equal(
  checkWorkFile({ name: "a.exe", type: "application/x-msdownload", size: 10 })
    .ok,
  false,
);

// --- The bucket enforces the same list (migration applied in production)

{
  const sql = readFileSync(
    new URL(
      "../../../supabase/migrations/20261007100000_programs_bucket_limits.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const array = sql.slice(
    sql.indexOf("ARRAY["),
    sql.indexOf("]", sql.indexOf("ARRAY[")),
  );
  const bucketTypes = [...array.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(
    [...bucketTypes].sort(),
    Object.keys(WORK_FILE_TYPES).sort(),
  );
  assert.match(sql, /file_size_limit = 52428800/);
  assert.equal(52428800, WORK_FILE_MAX_BYTES);
}

console.log("workFiles tests passed");
