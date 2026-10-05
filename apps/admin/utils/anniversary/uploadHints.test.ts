import assert from "node:assert/strict";
import { UPLOAD_RULES } from "../uploads";
import { acceptFor, formatFileSize, uploadHint } from "./uploadHints";

// The hints follow the server rules: every accepted type, the real cap, no SVG.
assert.equal(
  uploadHint(UPLOAD_RULES.anniversaryImage),
  "JPG, PNG, WebP, GIF ou AVIF, 10 Mo maximum",
);
assert.equal(
  uploadHint(UPLOAD_RULES.anniversaryAudio),
  "MP3, M4A, AAC, WAV, OGG, WebM ou FLAC, 50 Mo maximum",
);
assert.equal(
  uploadHint(UPLOAD_RULES.anniversaryDocument),
  "PDF, DOC ou DOCX, 50 Mo maximum",
);
assert.ok(!uploadHint(UPLOAD_RULES.anniversaryImage).includes("SVG"));

// The file picker filters on the same types.
const accept = acceptFor(UPLOAD_RULES.anniversaryDocument);
assert.ok(accept.includes("application/pdf"));
assert.ok(accept.includes(".docx"));
assert.ok(!accept.includes("svg"));

assert.equal(formatFileSize(500), "500 o");
assert.equal(formatFileSize(20 * 1024), "20 Ko");
assert.equal(formatFileSize(1.25 * 1024 * 1024), "1,3 Mo");

console.log("uploadHints.test.ts: ok");
