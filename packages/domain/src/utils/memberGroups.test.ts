import assert from "node:assert/strict";
import {
  audiencePeopleCount,
  audienceSentence,
  EVENT_AUDIENCE_MAX,
  groupMemberCountLabel,
  groupSlug,
  parseAudience,
  parseGroupInput,
  parseMemberRemove,
  parseMembersAdd,
  parseMemberUpdate,
} from "./memberGroups";

const P = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const validGroup = {
  name: "  Commission concerts ",
  kind: "commission",
  description: " Programme de la saison. ",
  color: "blue",
  icon: "music",
  visibility: "members",
};

// --- parseGroupInput ---

{
  const parsed = parseGroupInput(validGroup);
  assert.deepEqual(parsed, {
    ok: true,
    value: {
      name: "Commission concerts",
      kind: "commission",
      description: "Programme de la saison.",
      color: "blue",
      icon: "music",
      visibility: "members",
    },
  });
}
{
  // The description may be left out or empty: null.
  const { description: _, ...rest } = validGroup;
  const parsed = parseGroupInput(rest);
  assert.ok(parsed.ok && parsed.value.description === null);
  const empty = parseGroupInput({ ...validGroup, description: "  " });
  assert.ok(empty.ok && empty.value.description === null);
}
assert.deepEqual(parseGroupInput({ ...validGroup, name: " " }), {
  ok: false,
  error: "Le nom est obligatoire",
  field: "name",
});
assert.equal(
  parseGroupInput({ ...validGroup, name: "x".repeat(81) }).ok,
  false,
  "a name over 80 characters is refused",
);
assert.equal(
  parseGroupInput({ ...validGroup, kind: "ensemble" }).ok,
  false,
  "« ensemble » is not picked by hand",
);
assert.equal(parseGroupInput({ ...validGroup, color: "red" }).ok, false);
assert.equal(parseGroupInput({ ...validGroup, icon: "skull" }).ok, false);
assert.equal(
  parseGroupInput({ ...validGroup, visibility: "public" }).ok,
  false,
);
{
  const parsed = parseGroupInput({
    ...validGroup,
    slug: "ca",
    is_system: true,
  });
  assert.ok(!parsed.ok && parsed.error.includes("slug"));
  assert.ok(!parsed.ok && parsed.error.includes("is_system"));
}
assert.equal(
  parseGroupInput({ ...validGroup, archived: true }).ok,
  false,
  "a new group can't be archived",
);
assert.equal(parseGroupInput(null).ok, false);
assert.equal(parseGroupInput([]).ok, false);

// Partial (PATCH)
assert.deepEqual(parseGroupInput({ name: " Bureau " }, true), {
  ok: true,
  value: { name: "Bureau" },
});
assert.deepEqual(parseGroupInput({ archived: true }, true), {
  ok: true,
  value: { archived: true },
});
assert.deepEqual(parseGroupInput({ description: null }, true), {
  ok: true,
  value: { description: null },
});
assert.equal(parseGroupInput({}, true).ok, false, "nothing to change");
assert.equal(parseGroupInput({ archived: "yes" }, true).ok, false);
assert.equal(parseGroupInput({ name: "" }, true).ok, false);

// --- groupSlug ---

assert.equal(
  groupSlug("Conseil d’administration", new Set()),
  "conseil-d-administration",
);
assert.equal(
  groupSlug("Commission concerts", new Set(["commission-concerts"])),
  "commission-concerts-2",
);
assert.equal(
  groupSlug(
    "Commission concerts",
    new Set(["commission-concerts", "commission-concerts-2"]),
  ),
  "commission-concerts-3",
);
assert.equal(groupSlug("!!!", new Set()), "groupe");
assert.equal(groupSlug("Chœur d’accueil", new Set()), "choeur-d-accueil");
{
  const slug = groupSlug("a".repeat(200), new Set());
  assert.ok(slug.length <= 57, "room left for a suffix under the 60 limit");
  assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
}

// --- members ---

assert.deepEqual(parseMembersAdd({ profile_ids: [P(1), P(1), P(2)] }), {
  ok: true,
  value: { profile_ids: [P(1), P(2)], role: "member" },
});
assert.deepEqual(parseMembersAdd({ profile_ids: [P(1)], role: "manager" }), {
  ok: true,
  value: { profile_ids: [P(1)], role: "manager" },
});
assert.equal(parseMembersAdd({ profile_ids: [] }).ok, false);
assert.equal(parseMembersAdd({ profile_ids: ["nope"] }).ok, false);
assert.equal(parseMembersAdd({ profile_ids: [P(1)], role: "admin" }).ok, false);
assert.equal(
  parseMembersAdd({
    profile_ids: Array.from({ length: 101 }, (_, i) => P(i + 1)),
  }).ok,
  false,
);

assert.deepEqual(
  parseMemberUpdate({ profile_id: P(3), title: " Trésorière " }),
  {
    ok: true,
    value: { profile_id: P(3), title: "Trésorière" },
  },
);
assert.deepEqual(parseMemberUpdate({ profile_id: P(3), title: "" }), {
  ok: true,
  value: { profile_id: P(3), title: null },
});
assert.deepEqual(parseMemberUpdate({ profile_id: P(3), role: "manager" }), {
  ok: true,
  value: { profile_id: P(3), role: "manager" },
});
assert.equal(parseMemberUpdate({ profile_id: P(3) }).ok, false);
assert.equal(parseMemberUpdate({ profile_id: "x", role: "member" }).ok, false);
assert.equal(
  parseMemberUpdate({ profile_id: P(3), title: "x".repeat(61) }).ok,
  false,
);
assert.deepEqual(parseMemberRemove({ profile_id: P(4) }), {
  ok: true,
  value: P(4),
});
assert.equal(parseMemberRemove({}).ok, false);

// --- audience ---

assert.deepEqual(parseAudience([]), { ok: true, value: [] });
assert.deepEqual(parseAudience([P(1), P(1).toUpperCase()]), {
  ok: true,
  value: [P(1)],
});
assert.equal(parseAudience(["ca"]).ok, false);
assert.equal(parseAudience("ca").ok, false);
assert.equal(
  parseAudience(
    Array.from({ length: EVENT_AUDIENCE_MAX + 1 }, (_, i) => P(i + 1)),
  ).ok,
  false,
);

assert.equal(
  audiencePeopleCount([P(1), P(2)], {
    [P(1)]: ["claire", "jean"],
    [P(2)]: ["jean", "nadia"],
    [P(3)]: ["marc"],
  }),
  3,
  "someone in two of the groups counts once",
);
assert.equal(audiencePeopleCount([P(9)], {}), 0);

assert.equal(
  audienceSentence(11, ["Conseil d’administration"]),
  "Seules les 11 personnes du groupe « Conseil d’administration » le verront, avec les administrateurs, et recevront une notification si elles ont l’application. Les autres membres ne le verront pas.",
);
assert.equal(
  audienceSentence(1, ["Bureau"]),
  "Seule la personne du groupe « Bureau » le verra, avec les administrateurs, et recevra une notification si elle a l’application. Les autres membres ne le verront pas.",
);
assert.match(
  audienceSentence(14, ["A", "B"]),
  /^Seules les 14 personnes de ces 2 groupes/,
);
assert.match(audienceSentence(0, ["Bureau"]), /aucune notification ne partira/);
assert.match(audienceSentence(0, []), /^Tous les membres/);

assert.equal(groupMemberCountLabel(0), "Aucun membre");
assert.equal(groupMemberCountLabel(1), "1 membre");
assert.equal(groupMemberCountLabel(11), "11 membres");

console.log("memberGroups: all tests passed");
