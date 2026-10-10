// Run with: npx tsx lib/profilePhoto.test.ts
import assert from "node:assert/strict";
import {
  removeProfilePhoto,
  replaceProfilePhoto,
  type ProfilePhotoStore,
} from "./profilePhoto";

const ME = "11111111-2222-4333-8444-555555555555";
const OTHER = "99999999-8888-4777-8666-555555555555";
const BASE =
  "https://example.supabase.co/storage/v1/object/public/profile-pictures/";
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const jpeg = { type: "image/jpeg", size: JPEG.length };

function fakeStore(
  profiles: Record<string, string | null>,
  fail: { upload?: boolean; setUrl?: boolean } = {},
) {
  const log: string[] = [];
  const store: ProfilePhotoStore = {
    current: async (id) => ({
      found: Object.hasOwn(profiles, id),
      url: profiles[id] ?? null,
    }),
    upload: async (name, _bytes, type) => {
      log.push(`upload ${name} ${type}`);
      return !fail.upload;
    },
    publicUrl: (name) => BASE + name,
    setUrl: async (id, url) => {
      log.push(`set ${id} ${url}`);
      if (fail.setUrl) return false;
      profiles[id] = url;
      return true;
    },
    remove: async (name) => {
      log.push(`remove ${name}`);
    },
  };
  return { store, log, profiles };
}

async function main() {
  // Replaces the caller's photo and deletes their previous upload.
  {
    const { store, log, profiles } = fakeStore({
      [ME]: `${BASE}${ME}_1.png`,
      [OTHER]: `${BASE}${OTHER}_1.png`,
    });
    const result = await replaceProfilePhoto(store, ME, jpeg, JPEG, 2);
    assert.deepEqual(result, {
      status: 200,
      body: { url: `${BASE}${ME}_2.jpg` },
    });
    assert.deepEqual(log, [
      `upload ${ME}_2.jpg image/jpeg`,
      `set ${ME} ${BASE}${ME}_2.jpg`,
      `remove ${ME}_1.png`,
    ]);
    assert.equal(profiles[OTHER], `${BASE}${OTHER}_1.png`);
  }

  // A previous URL that isn't the caller's own file is never deleted.
  {
    const { store, log } = fakeStore({ [ME]: `${BASE}${OTHER}_1.png` });
    await replaceProfilePhoto(store, ME, jpeg, JPEG, 2);
    assert.ok(!log.some((l) => l.startsWith("remove")));
  }
  {
    const { store, log } = fakeStore({
      [ME]: "https://lh3.googleusercontent.com/a/avatar",
    });
    await replaceProfilePhoto(store, ME, jpeg, JPEG, 2);
    assert.ok(!log.some((l) => l.startsWith("remove")));
  }

  // Not an image: refused before anything is stored.
  {
    const { store, log } = fakeStore({ [ME]: null });
    const html = new TextEncoder().encode("<html><script>");
    const result = await replaceProfilePhoto(
      store,
      ME,
      { type: "image/jpeg", size: html.length },
      html,
    );
    assert.equal(result.status, 400);
    assert.deepEqual(log, []);
  }
  {
    const { store, log } = fakeStore({ [ME]: null });
    const svg = new TextEncoder().encode("<svg onload=x>");
    const result = await replaceProfilePhoto(
      store,
      ME,
      { type: "image/svg+xml", size: svg.length },
      svg,
    );
    assert.equal(result.status, 400);
    assert.deepEqual(log, []);
  }

  // An account without a member profile can't upload.
  {
    const { store, log } = fakeStore({});
    const result = await replaceProfilePhoto(store, ME, jpeg, JPEG);
    assert.equal(result.status, 403);
    assert.deepEqual(log, []);
  }

  // Upload failure: nothing else happens.
  {
    const { store, log } = fakeStore({ [ME]: null }, { upload: true });
    const result = await replaceProfilePhoto(store, ME, jpeg, JPEG, 2);
    assert.equal(result.status, 500);
    assert.deepEqual(log, [`upload ${ME}_2.jpg image/jpeg`]);
  }

  // Profile update failure: the new file is removed, the old one kept.
  {
    const { store, log } = fakeStore(
      { [ME]: `${BASE}${ME}_1.png` },
      { setUrl: true },
    );
    const result = await replaceProfilePhoto(store, ME, jpeg, JPEG, 2);
    assert.equal(result.status, 500);
    assert.equal(log.at(-1), `remove ${ME}_2.jpg`);
    assert.ok(!log.includes(`remove ${ME}_1.png`));
  }

  // Removing: clears the URL and deletes the caller's file only.
  {
    const { store, log, profiles } = fakeStore({ [ME]: `${BASE}${ME}_1.png` });
    const result = await removeProfilePhoto(store, ME);
    assert.deepEqual(result, { status: 200, body: { url: null } });
    assert.deepEqual(log, [`set ${ME} null`, `remove ${ME}_1.png`]);
    assert.equal(profiles[ME], null);
  }
  {
    const { store, log } = fakeStore({ [ME]: `${BASE}${OTHER}_1.png` });
    await removeProfilePhoto(store, ME);
    assert.deepEqual(log, [`set ${ME} null`]);
  }
  {
    const { store } = fakeStore({});
    assert.equal((await removeProfilePhoto(store, ME)).status, 403);
  }

  console.log("profilePhoto: all tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
