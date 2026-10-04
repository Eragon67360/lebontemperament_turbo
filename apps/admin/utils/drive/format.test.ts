import assert from "node:assert/strict";
import {
  describeFolderContents,
  driveItemUrl,
  fileTypeLabel,
  formatFileSize,
  formatModifiedDate,
  syncStatus,
  type SyncRunLike,
} from "./format";

// --- Sizes in French units, decimal comma, null when Drive gives none ---
assert.equal(formatFileSize(0), "0 octet");
assert.equal(formatFileSize(1), "1 octet");
assert.equal(formatFileSize(512), "512 octets");
assert.equal(formatFileSize(1024), "1 Ko");
assert.equal(formatFileSize(1536), "1,5 Ko");
assert.equal(formatFileSize(12.34 * 1024 * 1024), "12,3 Mo");
assert.equal(formatFileSize(3 * 1024 ** 3), "3 Go");
assert.equal(formatFileSize(null), null);
assert.equal(formatFileSize(undefined), null);
assert.equal(formatFileSize(Number.NaN), null);
assert.equal(formatFileSize(-5), null);

// --- Types: mime first, then extension, then family ---
assert.equal(fileTypeLabel("application/pdf", "x.pdf"), "PDF");
assert.equal(
  fileTypeLabel("application/vnd.google-apps.document", "Planning"),
  "Document Google",
);
assert.equal(
  fileTypeLabel("application/octet-stream", "Kyrie.mscz"),
  "MuseScore",
);
assert.equal(fileTypeLabel("audio/mpeg", "Alto.mp3"), "Audio MP3");
assert.equal(fileTypeLabel("audio/ogg", "Alto.ogg"), "Audio");
assert.equal(fileTypeLabel("image/jpeg", "affiche.jpg"), "Image");
assert.equal(fileTypeLabel("video/mp4", "film"), "Vidéo");
assert.equal(fileTypeLabel(null, "sans-extension"), "Fichier");
assert.equal(fileTypeLabel(null), "Fichier");

// --- Dates: the Paris day ---
assert.equal(formatModifiedDate("2026-09-12T08:00:00Z"), "12 sept. 2026");
// 23:30 UTC on the 31st is already the 1st in Paris.
assert.equal(formatModifiedDate("2026-12-31T23:30:00Z"), "1 janv. 2027");
assert.equal(formatModifiedDate(null), null);
assert.equal(formatModifiedDate("pas une date"), null);

// --- Drive links ---
assert.equal(
  driveItemUrl({ drive_id: "abcDEF123456", kind: "folder" }),
  "https://drive.google.com/drive/folders/abcDEF123456",
);
assert.equal(
  driveItemUrl({ drive_id: "abcDEF123456", kind: "file" }),
  "https://drive.google.com/file/d/abcDEF123456/view",
);

// --- Folder contents ---
assert.equal(describeFolderContents({ folders: 0, documents: 0 }), "Vide");
assert.equal(
  describeFolderContents({ folders: 1, documents: 1 }),
  "1 dossier · 1 document",
);
assert.equal(
  describeFolderContents({ folders: 3, documents: 0 }),
  "3 dossiers",
);
assert.equal(
  describeFolderContents({ folders: 0, documents: 24 }),
  "24 documents",
);
assert.equal(
  describeFolderContents(
    { folders: 3, documents: 2 },
    { one: "programme", many: "programmes" },
  ),
  "3 programmes · 2 documents",
);

// --- Sync status: only applies count; the latest decides the tone ---
{
  const run = (
    started_at: string,
    mode: string,
    status: string,
    finished_at: string | null = started_at,
  ): SyncRunLike => ({
    started_at,
    finished_at,
    mode,
    status,
  });

  assert.deepEqual(syncStatus([]), {
    tone: "info",
    label: "Aucune mise à jour de l'index depuis Drive n'est enregistrée.",
    appliedAt: null,
  });
  // Dry runs alone never updated the index.
  assert.equal(
    syncStatus([run("2026-10-03T10:00:00Z", "dry_run", "success")]).tone,
    "info",
  );

  const ok = syncStatus([
    run("2026-10-03T10:00:00Z", "dry_run", "error"),
    run("2026-10-02T01:30:00Z", "apply", "success", "2026-10-02T01:31:00Z"),
    run("2026-10-01T01:30:00Z", "apply", "success"),
  ]);
  assert.equal(ok.tone, "success");
  assert.equal(ok.appliedAt, "2026-10-02T01:31:00Z");

  // Order of the input doesn't matter; a failed latest apply keeps the last good date.
  const failed = syncStatus([
    run("2026-10-02T01:30:00Z", "apply", "success", "2026-10-02T01:31:00Z"),
    run("2026-10-03T01:30:00Z", "apply", "error"),
  ]);
  assert.equal(failed.tone, "danger");
  assert.equal(failed.appliedAt, "2026-10-02T01:31:00Z");

  assert.equal(
    syncStatus([run("2026-10-03T01:30:00Z", "apply", "running", null)]).tone,
    "warning",
  );

  // The route reads the last successful apply on its own: the date stays even
  // when every apply in the window failed.
  const window = ["03", "04", "05", "06", "07"].map((day) =>
    run(`2026-10-${day}T01:30:00Z`, "apply", "error"),
  );
  assert.equal(syncStatus(window).appliedAt, null);
  const kept = syncStatus(
    window,
    run("2026-09-28T01:30:00Z", "apply", "success", "2026-09-28T01:31:00Z"),
  );
  assert.equal(kept.tone, "danger");
  assert.equal(kept.appliedAt, "2026-09-28T01:31:00Z");
}

console.log("utils/drive/format.test.ts: ok");
