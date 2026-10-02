import assert from "node:assert/strict";
import {
  ANNIVERSARY_DEFAULT_FOLDER,
  ANNIVERSARY_FOLDERS,
  anniversaryKind,
  isAllowedAnniversaryFolder,
  isAllowedProjectImageFolder,
  isUuid,
  MB,
  PROJECT_IMAGE_DEFAULT_FOLDER,
  resolveUploadFolder,
  UPLOAD_RULES,
  validateUpload,
} from "./uploads";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === "string" ? [...part].map((c) => c.charCodeAt(0)) : part,
    ),
  );

const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10], "JFIF");
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const GIF = bytes("GIF89a", [1, 0, 1, 0]);
const WEBP = bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 ");
const AVIF = bytes([0, 0, 0, 0x1c], "ftypavif", [0, 0, 0, 0], "avifmif1");
const AVIF_MIF1 = bytes([0, 0, 0, 0x20], "ftypmif1", [0, 0, 0, 0], "mif1avif");
const PDF = bytes("%PDF-1.7\n");
const DOC = bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0]);
const DOCX = bytes([0x50, 0x4b, 0x03, 0x04, 0x14, 0]);
const SVG = bytes('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');
const HTML = bytes("<!doctype html><script>1</script>");
const MP3 = bytes("ID3", [4, 0, 0, 0, 0, 0, 0]);

const file = (type: string, size = 1000) => ({ type, size });
const check = (
  type: string,
  content: Uint8Array,
  rule: (typeof UPLOAD_RULES)[keyof typeof UPLOAD_RULES],
  size = 1000,
) => validateUpload(file(type, size), content, rule);

// --- Allowed types, with the stored extension taken from the type ---
{
  const r = check("image/jpeg", JPEG, UPLOAD_RULES.storage);
  assert.deepEqual(r, { ok: true, mimeType: "image/jpeg", extension: "jpg" });
}
assert.equal(check("image/png", PNG, UPLOAD_RULES.storage).ok, true);
assert.equal(check("image/gif", GIF, UPLOAD_RULES.profilePicture).ok, true);
assert.equal(check("image/webp", WEBP, UPLOAD_RULES.projectImage).ok, true);
assert.equal(check("image/avif", AVIF, UPLOAD_RULES.anniversaryImage).ok, true);
assert.equal(
  check("image/avif", AVIF_MIF1, UPLOAD_RULES.anniversaryImage).ok,
  true,
);
assert.deepEqual(check("application/pdf", PDF, UPLOAD_RULES.storage), {
  ok: true,
  mimeType: "application/pdf",
  extension: "pdf",
});
assert.equal(
  check("application/pdf", PDF, UPLOAD_RULES.anniversaryDocument).ok,
  true,
);
assert.equal(
  check("application/msword", DOC, UPLOAD_RULES.anniversaryDocument).ok,
  true,
);
assert.equal(
  check(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    DOCX,
    UPLOAD_RULES.anniversaryDocument,
  ).ok,
  true,
);
assert.deepEqual(check("audio/mpeg", MP3, UPLOAD_RULES.anniversaryAudio), {
  ok: true,
  mimeType: "audio/mpeg",
  extension: "mp3",
});
// Type parameters and case are ignored.
assert.equal(check("IMAGE/PNG; charset=x", PNG, UPLOAD_RULES.storage).ok, true);

// --- SVG is refused everywhere, as a declared type ---
for (const rule of Object.values(UPLOAD_RULES)) {
  const r = check("image/svg+xml", SVG, rule);
  assert.deepEqual(r, { ok: false, error: "Type de fichier non autorisé" });
}
// ... and disguised as an allowed image type.
for (const type of ["image/png", "image/jpeg", "image/gif", "image/webp"]) {
  const r = check(type, SVG, UPLOAD_RULES.profilePicture);
  assert.equal(r.ok, false, type);
}
assert.equal(check("application/pdf", HTML, UPLOAD_RULES.storage).ok, false);
assert.equal(check("image/png", JPEG, UPLOAD_RULES.storage).ok, false);

// --- Other disallowed types ---
for (const type of [
  "text/html",
  "application/javascript",
  "application/octet-stream",
  "video/mp4",
  "image/heic",
  "",
]) {
  assert.equal(check(type, JPEG, UPLOAD_RULES.anniversaryImage).ok, false);
}
// Each route only takes its own kinds.
assert.equal(
  check("application/pdf", PDF, UPLOAD_RULES.profilePicture).ok,
  false,
);
assert.equal(
  check("application/pdf", PDF, UPLOAD_RULES.projectImage).ok,
  false,
);
assert.equal(check("audio/mpeg", MP3, UPLOAD_RULES.storage).ok, false);
assert.equal(check("image/png", PNG, UPLOAD_RULES.anniversaryAudio).ok, false);
assert.equal(
  check("image/png", PNG, UPLOAD_RULES.anniversaryDocument).ok,
  false,
);
// Prototype keys are not types.
assert.equal(check("constructor", PNG, UPLOAD_RULES.storage).ok, false);
assert.equal(check("__proto__", PNG, UPLOAD_RULES.storage).ok, false);

// --- Size caps ---
assert.equal(UPLOAD_RULES.storage.maxBytes, 5 * MB);
assert.equal(UPLOAD_RULES.profilePicture.maxBytes, 5 * MB);
assert.equal(UPLOAD_RULES.projectImage.maxBytes, 10 * MB);
assert.equal(UPLOAD_RULES.anniversaryImage.maxBytes, 10 * MB);
assert.equal(UPLOAD_RULES.anniversaryAudio.maxBytes, 50 * MB);
assert.equal(UPLOAD_RULES.anniversaryDocument.maxBytes, 50 * MB);
for (const rule of Object.values(UPLOAD_RULES)) {
  const [type] = Object.keys(rule.types);
  const content =
    type === "image/jpeg" ? JPEG : type === "application/pdf" ? PDF : MP3;
  const exact = validateUpload(file(type!, rule.maxBytes), content, rule);
  assert.equal(exact.ok, true, type);
  const over = validateUpload(file(type!, rule.maxBytes + 1), content, rule);
  assert.equal(over.ok, false);
  assert.match(
    (over as { error: string }).error,
    /^Le fichier est trop volumineux \(max \d+ Mo\)$/,
  );
}
assert.deepEqual(check("image/png", PNG, UPLOAD_RULES.storage, 0), {
  ok: false,
  error: "Le fichier est vide",
});

// --- Cloudinary folders ---
const project = (f: unknown) =>
  resolveUploadFolder(
    f,
    PROJECT_IMAGE_DEFAULT_FOLDER,
    isAllowedProjectImageFolder,
  );
assert.equal(project(null), "Site/concerts");
assert.equal(project(""), "Site/concerts");
assert.equal(project("Site/concerts"), "Site/concerts");
assert.equal(project("Site/concerts/king-arthur"), "Site/concerts/king-arthur");
assert.equal(project("Site/concerts/projects"), "Site/concerts/projects");
assert.equal(project("Site/concerts/../anniversary"), null);
assert.equal(project("Site/concerts/a/b"), null);
assert.equal(project("Site/concerts/"), null);
assert.equal(project("Site/anniversary"), null);
assert.equal(project("/Site/concerts"), null);
assert.equal(project("other"), null);
assert.equal(project(42), null);

const anniversary = (f: unknown) =>
  resolveUploadFolder(
    f,
    ANNIVERSARY_DEFAULT_FOLDER,
    isAllowedAnniversaryFolder,
  );
assert.equal(anniversary(undefined), "Site/anniversary");
for (const folder of ANNIVERSARY_FOLDERS) {
  assert.equal(anniversary(folder), folder);
}
assert.equal(anniversary("Site/anniversary/photos/../../x"), null);
assert.equal(anniversary("Site/anniversary/other"), null);
assert.equal(anniversary("Site/concerts"), null);
assert.equal(anniversary("samples"), null);

// --- Anniversary resource types ---
assert.equal(anniversaryKind("image", "image/png"), "image");
assert.equal(anniversaryKind("audio", "audio/mpeg"), "audio");
assert.equal(anniversaryKind("raw", "application/pdf"), "raw");
assert.equal(anniversaryKind("video", "video/mp4"), null);
assert.equal(anniversaryKind("auto", "image/png"), null);
assert.equal(anniversaryKind(null, "image/png"), "image");
assert.equal(anniversaryKind(null, "audio/ogg"), "audio");
assert.equal(anniversaryKind(null, "application/msword"), "raw");
assert.equal(anniversaryKind(null, "image/svg+xml"), null);
assert.equal(anniversaryKind(null, "text/html"), null);

// --- User ids in storage paths ---
assert.equal(isUuid("0b6f8f3e-2a4b-4c1d-9e8f-123456789abc"), true);
assert.equal(isUuid("../0b6f8f3e-2a4b-4c1d-9e8f-123456789abc"), false);
assert.equal(isUuid("0b6f8f3e"), false);
assert.equal(isUuid(null), false);

console.log("uploads.test.ts: all assertions passed");
