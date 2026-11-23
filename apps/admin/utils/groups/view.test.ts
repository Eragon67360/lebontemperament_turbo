import type { MemberGroup } from "@repo/domain/types/memberGroups";
import assert from "node:assert/strict";
import type { GroupEventLine, GroupPerson } from "./types";
import {
  archiveBlocker,
  audienceLabel,
  buildGroupSummaries,
  canManageGroups,
  filterByKind,
  groupFromSearch,
  managersLine,
  newEventForGroupHref,
  sortGroups,
  sortMembers,
  splitGroups,
} from "./view";

const group = (over: Partial<MemberGroup>): MemberGroup => ({
  id: "g",
  name: "Groupe",
  slug: "groupe",
  kind: "autre",
  description: null,
  color: "teal",
  icon: "users",
  visibility: "private",
  is_system: false,
  archived_at: null,
  created_by: null,
  created_at: "2026-11-23T18:00:00Z",
  updated_at: "2026-11-23T18:00:00Z",
  ...over,
});
const person = (id: string, name: string): GroupPerson => ({
  id,
  name,
  email: `${id}@example.test`,
  avatar: null,
});
const event = (
  id: string,
  date_from: string,
  date_to: string | null = null,
  time = "20:00:00",
): GroupEventLine => ({
  id,
  title: `Événement ${id}`,
  date_from,
  date_to,
  time,
  location: "Wangen",
});

const ca = group({
  id: "ca",
  name: "Conseil d’administration",
  kind: "instance",
  is_system: true,
});
const bureau = group({ id: "bureau", name: "Bureau", kind: "instance" });
const concerts = group({
  id: "concerts",
  name: "Commission concerts",
  kind: "commission",
});
const accueil = group({ id: "accueil", name: "Accueil", kind: "autre" });
const old = group({
  id: "old",
  name: "Ancienne commission",
  kind: "commission",
  archived_at: "2026-01-01T00:00:00Z",
});

// --- Order: the CA first, then instances, commissions, others; by name ---
assert.deepEqual(
  sortGroups([accueil, concerts, bureau, ca]).map((g) => g.id),
  ["ca", "bureau", "concerts", "accueil"],
);
{
  const { active, archived } = splitGroups([old, accueil, ca]);
  assert.deepEqual(
    active.map((g) => g.id),
    ["ca", "accueil"],
  );
  assert.deepEqual(
    archived.map((g) => g.id),
    ["old"],
  );
}
assert.deepEqual(
  filterByKind([ca, concerts, accueil], "commission").map((g) => g.id),
  ["concerts"],
);
assert.equal(filterByKind([ca, concerts], "all").length, 2);

assert.deepEqual(
  sortMembers([
    { ...person("b", "Bernard ZOLA"), role: "member" as const },
    { ...person("c", "Claire MARTIN"), role: "manager" as const },
    { ...person("a", "Anne ADAM"), role: "member" as const },
  ]).map((m) => m.id),
  ["c", "a", "b"],
  "« Responsable » first, then by name",
);

// --- The cards ---
{
  const people = new Map(
    ["p1", "p2", "p3", "p4", "p5", "p6", "p7"].map((id, i) => [
      id,
      person(id, `Personne ${String.fromCharCode(65 + i)}`),
    ]),
  );
  const summaries = buildGroupSummaries({
    groups: [concerts, ca],
    memberships: [
      ...["p1", "p2", "p3", "p4", "p5", "p6"].map((profile_id) => ({
        group_id: "ca",
        profile_id,
        role: "member" as const,
      })),
      { group_id: "ca", profile_id: "p7", role: "manager" },
      { group_id: "ca", profile_id: "gone", role: "member" },
      { group_id: "concerts", profile_id: "p1", role: "manager" },
    ],
    people,
    audiences: [
      { event_id: "past", group_id: "ca" },
      { event_id: "later", group_id: "ca" },
      { event_id: "soon", group_id: "ca" },
      { event_id: "today", group_id: "concerts" },
    ],
    events: [
      event("past", "2026-11-01"),
      event("later", "2026-12-10"),
      event("soon", "2026-12-03"),
      event("today", "2026-11-20", "2026-11-23"),
    ],
    today: "2026-11-23",
  });
  assert.deepEqual(
    summaries.map((s) => s.id),
    ["ca", "concerts"],
  );
  const [caCard, concertsCard] = summaries;
  assert.equal(
    caCard!.member_ids.length,
    7,
    "a profile that is gone is skipped",
  );
  assert.equal(caCard!.preview.length, 5, "five faces at most");
  assert.equal(caCard!.preview[0]!.id, "p7", "the « Responsable » first");
  assert.deepEqual(caCard!.managers, ["Personne G"]);
  assert.equal(caCard!.next_event?.id, "soon", "the soonest not-over event");
  assert.equal(
    concertsCard!.next_event?.id,
    "today",
    "an event whose last day is today is still upcoming",
  );
}
{
  const [lonely] = buildGroupSummaries({
    groups: [accueil],
    memberships: [],
    people: new Map(),
    audiences: [],
    events: [],
    today: "2026-11-23",
  });
  assert.deepEqual(lonely!.member_ids, []);
  assert.equal(lonely!.next_event, null);
}

// --- Event rows ---
{
  const names = new Map([
    ["ca", "Conseil d’administration"],
    ["bureau", "Bureau"],
    ["concerts", "Commission concerts"],
  ]);
  assert.equal(audienceLabel([], names), null);
  assert.equal(audienceLabel(undefined, names), null);
  assert.equal(audienceLabel(["ca"], names), "Conseil d’administration");
  assert.equal(
    audienceLabel(["concerts", "bureau"], names),
    "Bureau, Commission concerts",
  );
  assert.equal(audienceLabel(["ca", "bureau", "concerts"], names), "3 groupes");
  assert.equal(audienceLabel(["unknown"], names), "1 groupe");
  assert.equal(audienceLabel(["ca", "unknown"], names), "2 groupes");
}

// --- Who may do what ---
assert.equal(canManageGroups("superadmin"), true);
assert.equal(canManageGroups("admin"), false);
assert.equal(canManageGroups(null), false);
assert.match(archiveBlocker(ca) ?? "", /ne s’archive pas/);
assert.equal(archiveBlocker(bureau), null);
assert.equal(managersLine([]), null);
assert.equal(managersLine(["Claire MARTIN"]), "Responsable : Claire MARTIN");
assert.equal(
  managersLine(["Claire MARTIN", "Jean DUPONT"]),
  "Responsables : Claire MARTIN, Jean DUPONT",
);

// --- « Nouvel événement » of a group page ---
{
  const id = "00000000-0000-4000-8000-000000000001";
  const href = newEventForGroupHref(id);
  assert.equal(href, `/dashboard/members/evenements?pour=${id}`);
  assert.equal(groupFromSearch(href.slice(href.indexOf("?"))), id);
  assert.equal(groupFromSearch(`?pour=${id.toUpperCase()}`), id);
  assert.equal(groupFromSearch("?pour=ca"), null, "only an id");
  assert.equal(groupFromSearch(""), null);
}

console.log("groups view: all tests passed");
