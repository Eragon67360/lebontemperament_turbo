// Run with: npx tsx src/utils/profilePicture.test.ts
import assert from "node:assert/strict";
import {
  ownProfilePictureFile,
  PROFILE_PICTURE_RULE,
  profilePictureFileName,
} from "./profilePicture";
import { validateUpload } from "./uploads";

const ME = "11111111-2222-4333-8444-555555555555";
const OTHER = "99999999-8888-4777-8666-555555555555";
const HOST = "https://example.supabase.co";
const url = (name: string, bucket = "profile-pictures") =>
  `${HOST}/storage/v1/object/public/${bucket}/${name}`;

// Names
assert.equal(profilePictureFileName(ME, "jpg", 42), `${ME}_42.jpg`);

// Own files are found, whatever the host (custom domain or project host)
assert.equal(
  ownProfilePictureFile(url(`${ME}_1728550000000.jpg`), ME),
  `${ME}_1728550000000.jpg`,
);
assert.equal(
  ownProfilePictureFile(
    `https://api.example.com/storage/v1/object/public/profile-pictures/${ME}_1.png`,
    ME,
  ),
  `${ME}_1.png`,
);

// Anything else is never deleted
assert.equal(ownProfilePictureFile(url(`${OTHER}_1.jpg`), ME), null);
assert.equal(ownProfilePictureFile(url(`${ME}_1.jpg`, "programs"), ME), null);
assert.equal(ownProfilePictureFile(url(`../${ME}_1.jpg`), ME), null);
assert.equal(ownProfilePictureFile(url(`x/${ME}_1.jpg`), ME), null);
assert.equal(ownProfilePictureFile(url(`${ME}_1.html`), ME), null);
assert.equal(ownProfilePictureFile(url("photo.jpg"), ME), null);
assert.equal(
  ownProfilePictureFile("https://lh3.googleusercontent.com/a/abc=s96-c", ME),
  null,
);
assert.equal(ownProfilePictureFile("not a url", ME), null);
assert.equal(ownProfilePictureFile(null, ME), null);
assert.equal(ownProfilePictureFile(url(`${ME}_1.jpg`), "not-a-uuid"), null);

// The rule: images only, 5 MB
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
assert.deepEqual(
  validateUpload(
    { type: "image/jpeg", size: 1000 },
    JPEG,
    PROFILE_PICTURE_RULE,
  ),
  { ok: true, mimeType: "image/jpeg", extension: "jpg" },
);
assert.equal(
  validateUpload(
    { type: "image/svg+xml", size: 1000 },
    new TextEncoder().encode("<svg"),
    PROFILE_PICTURE_RULE,
  ).ok,
  false,
);
assert.equal(
  validateUpload(
    { type: "image/png", size: 1000 },
    new TextEncoder().encode("<html>"),
    PROFILE_PICTURE_RULE,
  ).ok,
  false,
);
assert.equal(
  validateUpload(
    { type: "image/jpeg", size: 6 * 1024 * 1024 },
    JPEG,
    PROFILE_PICTURE_RULE,
  ).ok,
  false,
);

console.log("profilePicture: all tests passed");
