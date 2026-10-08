import type { SiteAnnouncement } from "@/hooks/useAnnouncements";
import assert from "node:assert/strict";
import {
  announcementInputFromForm,
  formFromAnnouncement,
  isSameAnnouncementForm,
} from "./form";
import { overLimitMessage, windowsOverlap } from "./limits";
import { announcementCreateSchema, announcementPatchSchema } from "./schemas";

const campaign: SiteAnnouncement = {
  id: "5d6f0b0e-2a43-4c1b-9b7e-0c1a2d3e4f50",
  placement: "donation_popover",
  title: "Nouvelle campagne de dons",
  body: "Notre nouvelle campagne est ouverte.",
  link_label: "Découvrir",
  link_url: "/don",
  starts_on: null,
  ends_on: null,
  status: "published",
  sort_order: 0,
  created_at: "2026-10-08T00:00:00+00:00",
  updated_at: "2026-10-08T00:00:00+00:00",
};

// Round trip.
const form = formFromAnnouncement(campaign);
assert.equal(form.published, true);
const back = announcementInputFromForm(form);
assert.ok(back.ok);
assert.deepEqual(back.value, {
  placement: "donation_popover",
  title: "Nouvelle campagne de dons",
  body: "Notre nouvelle campagne est ouverte.",
  link_label: "Découvrir",
  link_url: "/don",
  starts_on: null,
  ends_on: null,
  status: "published",
});
assert.ok(announcementCreateSchema.safeParse(back.value).success);
assert.equal(
  isSameAnnouncementForm(form, formFromAnnouncement(campaign)),
  true,
);

// A new one starts empty, on the home page, as a draft.
const fresh = formFromAnnouncement(null);
assert.equal(fresh.placement, "home");
assert.equal(fresh.published, false);
const empty = announcementInputFromForm(fresh);
assert.ok(!empty.ok && empty.errors.title && empty.errors.linkUrl);

// Links: a page of the site or https only; dates in order.
for (const url of ["//evil.example", "javascript:alert(1)", "http://x.fr"]) {
  const check = announcementInputFromForm({ ...form, linkUrl: url });
  assert.ok(!check.ok && check.errors.linkUrl, url);
  assert.equal(
    announcementPatchSchema.safeParse({ link_url: url }).success,
    false,
  );
}
const reversed = announcementInputFromForm({
  ...form,
  startsOn: "2027-01-15",
  endsOn: "2026-12-01",
});
assert.ok(!reversed.ok && reversed.errors.endsOn);
assert.equal(
  announcementPatchSchema.safeParse({
    starts_on: "2027-01-15",
    ends_on: "2026-12-01",
  }).success,
  false,
);
assert.equal(announcementPatchSchema.safeParse({}).success, false);
assert.equal(
  announcementCreateSchema.safeParse({ ...back.value, id: campaign.id })
    .success,
  false,
);

// Limits: two on the home page at once, one donation card.
const open = { starts_on: null, ends_on: null };
const december = { starts_on: "2026-12-01", ends_on: "2026-12-31" };
const march = { starts_on: "2027-03-01", ends_on: "2027-03-14" };
assert.equal(windowsOverlap(open, december), true);
assert.equal(windowsOverlap(december, march), false);
const today = "2026-10-09";
assert.equal(overLimitMessage("home", december, [open], today), null);
assert.ok(overLimitMessage("home", december, [open, december], today));
assert.equal(
  overLimitMessage("home", march, [december, december], today),
  null,
);
assert.ok(overLimitMessage("donation_popover", open, [open], today));
// An ended one doesn't count.
assert.equal(
  overLimitMessage(
    "donation_popover",
    open,
    [{ starts_on: null, ends_on: "2026-01-15" }],
    today,
  ),
  null,
);

console.log("announcements/form: all assertions passed");
