import assert from "node:assert/strict";
import {
  ANNOUNCEMENT_LINK_PATTERN,
  announcementPhase,
  isAnnouncementLive,
  isExternalLink,
} from "./announcements";

const open = { starts_on: null, ends_on: null };
const winter = { starts_on: "2026-12-01", ends_on: "2027-01-15" };

assert.equal(isAnnouncementLive(open, "2026-10-09"), true);
assert.equal(isAnnouncementLive(winter, "2026-11-30"), false);
assert.equal(isAnnouncementLive(winter, "2026-12-01"), true);
assert.equal(isAnnouncementLive(winter, "2027-01-15"), true);
assert.equal(isAnnouncementLive(winter, "2027-01-16"), false);
assert.equal(announcementPhase(winter, "2026-11-30"), "scheduled");
assert.equal(announcementPhase(winter, "2026-12-24"), "live");
assert.equal(announcementPhase(winter, "2027-02-01"), "ended");

for (const ok of [
  "/don",
  "/",
  "/concerts?x=1",
  "https://view.genially.com/abc",
]) {
  assert.ok(ANNOUNCEMENT_LINK_PATTERN.test(ok), ok);
}
for (const bad of [
  "//evil.example",
  "javascript:alert(1)",
  "http://x.fr",
  "don",
  "https://a b",
]) {
  assert.equal(ANNOUNCEMENT_LINK_PATTERN.test(bad), false, bad);
}
assert.equal(isExternalLink("https://x.fr"), true);
assert.equal(isExternalLink("/don"), false);

console.log("announcements.test.ts: ok");
