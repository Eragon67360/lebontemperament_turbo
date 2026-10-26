// Run with: npx tsx src/utils/profilePicture.test.ts
import assert from "node:assert/strict";
import {
  googleAvatarUrl,
  memberPhotoUrl,
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

// Google account pictures: https on a googleusercontent.com subdomain only
// (the same cases as the database functions' pattern).
for (const kept of [
  "https://lh3.googleusercontent.com/a/ACg8ocFakeAvatar=s96-c",
  "https://lh5.googleusercontent.com/-Fake/AAAAAAAAAAI/AAAAAAAAAAA/photo.jpg",
  "HTTPS://LH3.GOOGLEUSERCONTENT.COM/a/Fake",
  "https://lh3.googleusercontent.com",
  "https://lh3.googleusercontent.com/a/fake?sz=96#top",
]) {
  assert.equal(googleAvatarUrl(kept), kept, kept);
}
for (const dropped of [
  "https://other.example/photo.png",
  "http://lh3.googleusercontent.com/a/fake",
  "https://lh3.googleusercontent.com.other.example/a",
  "https://other.example/lh3.googleusercontent.com/a",
  "https://user@lh3.googleusercontent.com/a",
  "https://lh3.googleusercontent.com@other.example/a",
  "https://lh3.googleusercontent.com:8443/a",
  "https://googleusercontent.com/a",
  "//lh3.googleusercontent.com/a",
  "https://lh3.googleusercontent.com/a b",
  "https://lh3.googleusercontent.com/a\n",
  "https://lh3.googleusercontent.com\\@other.example/",
  "https://lh3.googleusercontent.com./a",
  "https://lh3.googleusercontent.com%2eother.example/a",
  " https://lh3.googleusercontent.com/a",
  "javascript:alert(1)",
  "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  `${HOST}/storage/v1/object/public/profile-pictures/${ME}_1.jpg`,
  "not a url",
  "",
  42,
  null,
  undefined,
  {},
]) {
  assert.equal(googleAvatarUrl(dropped), null, String(dropped));
}

// Member photos: the association's Storage (public files on the listed
// origins) or a Google picture; anything else shows the initials.
{
  const origins = [HOST, "https://api.example.com", undefined, "not a url"];
  for (const kept of [
    url(`${ME}_1.jpg`),
    "https://api.example.com/storage/v1/object/public/profile-pictures/x.png",
    "HTTPS://EXAMPLE.SUPABASE.CO/storage/v1/object/public/profile-pictures/x.png",
    "https://example.supabase.co:443/storage/v1/object/public/site-media/x.png",
    "https://lh3.googleusercontent.com/a/ACg8ocFakeAvatar=s96-c",
  ]) {
    assert.equal(memberPhotoUrl(kept, origins), kept, kept);
  }
  for (const dropped of [
    "https://someone-else.supabase.co/storage/v1/object/public/x/p.png",
    "https://example.supabase.co.other.example/storage/v1/object/public/p.png",
    "http://example.supabase.co/storage/v1/object/public/profile-pictures/x.png",
    "https://example.supabase.co/storage/v1/object/sign/x.png?token=t",
    "https://example.supabase.co/storage/v1/object/public/../../../rest/v1/x",
    "https://user:pw@example.supabase.co/storage/v1/object/public/x.png",
    "https://other.example/storage/v1/object/public/x.png",
    "https://other.example/photo.png",
    "/storage/v1/object/public/profile-pictures/x.png",
    "not a url",
    "",
    null,
    undefined,
  ]) {
    assert.equal(memberPhotoUrl(dropped, origins), null, String(dropped));
  }
  // A local Supabase (http) works when it is the configured origin.
  const local = "http://127.0.0.1:54321/storage/v1/object/public/p.png";
  assert.equal(memberPhotoUrl(local, ["http://127.0.0.1:54321"]), local);
  assert.equal(memberPhotoUrl(local, origins), null);
  assert.equal(memberPhotoUrl(url(`${ME}_1.jpg`), []), null);
}

console.log("profilePicture: all tests passed");
