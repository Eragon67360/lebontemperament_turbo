import assert from "node:assert/strict";
import { cloudinaryUrl, fileNameOf, isAbsoluteUrl } from "./media";

// A stored public_id becomes a real delivery URL (the archive bug: the
// public_id used to be the href, a relative path under the admin).
assert.equal(
  cloudinaryUrl("Site/anniversary/archives/ag-2023_abc", "raw", "demo"),
  "https://res.cloudinary.com/demo/raw/upload/Site/anniversary/archives/ag-2023_abc",
);

// Images accept transformations.
assert.equal(
  cloudinaryUrl("Site/anniversary/photos/x", "image", "demo", "c_fill,w_400"),
  "https://res.cloudinary.com/demo/image/upload/c_fill,w_400/Site/anniversary/photos/x",
);

// A full URL (older rows) is kept as it is.
assert.equal(
  cloudinaryUrl(
    "https://res.cloudinary.com/demo/raw/upload/v1/x.pdf",
    "raw",
    "demo",
  ),
  "https://res.cloudinary.com/demo/raw/upload/v1/x.pdf",
);
assert.ok(isAbsoluteUrl("//cdn.example.org/x.pdf"));
assert.ok(!isAbsoluteUrl("Site/anniversary/x"));

// Segments are encoded, slashes kept.
assert.equal(
  cloudinaryUrl("Site/anniversary/archives/rapport 2024", "raw", "demo"),
  "https://res.cloudinary.com/demo/raw/upload/Site/anniversary/archives/rapport%202024",
);

// Nothing to show without a value or a cloud name.
assert.equal(cloudinaryUrl("", "raw", "demo"), null);
assert.equal(cloudinaryUrl(null, "raw", "demo"), null);
assert.equal(cloudinaryUrl("Site/x", "raw", undefined), null);

// File names for labels.
assert.equal(
  fileNameOf("Site/anniversary/audio/temoignage_x9"),
  "temoignage_x9",
);
assert.equal(fileNameOf("https://a.b/c/d%20e.pdf?x=1"), "d e.pdf");
assert.equal(fileNameOf(null), "");

console.log("media.test.ts: ok");
