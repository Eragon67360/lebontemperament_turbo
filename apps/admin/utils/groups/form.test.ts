import type { MemberGroup } from "@repo/domain/types/memberGroups";
import { parseGroupInput } from "@repo/domain/utils/memberGroups";
import assert from "node:assert/strict";
import {
  groupFormDefaults,
  groupFormSchema,
  groupFormToBody,
  groupFormToPatch,
  memberTitleSchema,
} from "./form";

const ca: MemberGroup = {
  id: "ca",
  name: "Conseil d’administration",
  slug: "ca",
  kind: "instance",
  description: null,
  color: "teal",
  icon: "landmark",
  visibility: "private",
  is_system: true,
  archived_at: null,
  created_by: null,
  created_at: "2026-11-23T18:00:00Z",
  updated_at: "2026-11-23T18:00:00Z",
};

// A new group starts private, a commission, teal, people icon.
{
  const values = groupFormDefaults(null);
  assert.equal(values.visibility, "private");
  assert.equal(values.kind, "commission");
  // Empty name: the form refuses it, in French.
  const parsed = groupFormSchema.safeParse(values);
  assert.equal(parsed.success, false);
  assert.equal(parsed.error?.issues[0]?.message, "Le nom est obligatoire");
}

// What the form sends is what the server accepts.
{
  const values = {
    ...groupFormDefaults(null),
    name: "  Commission concerts ",
    description: " Programme de la saison. ",
  };
  const parsed = groupFormSchema.parse(values);
  const body = groupFormToBody(parsed);
  assert.deepEqual(body, {
    name: "Commission concerts",
    kind: "commission",
    description: "Programme de la saison.",
    color: "teal",
    icon: "users",
    visibility: "private",
  });
  assert.deepEqual(parseGroupInput(body), { ok: true, value: body });
  assert.equal(
    groupFormToBody({ ...parsed, description: "   " }).description,
    null,
  );
}
assert.equal(
  groupFormSchema.safeParse({
    ...groupFormDefaults(null),
    name: "x".repeat(81),
  }).success,
  false,
);
assert.equal(
  groupFormSchema.safeParse({
    ...groupFormDefaults(null),
    name: "A",
    kind: "ensemble",
  }).success,
  false,
  "« ensemble » is not offered",
);

// An edit starts from the group, and sends only what changed.
{
  const values = groupFormDefaults(ca);
  assert.equal(values.name, ca.name);
  assert.equal(values.icon, "landmark");
  assert.deepEqual(groupFormToPatch(ca, values), {}, "untouched: nothing");
  assert.deepEqual(
    groupFormToPatch(ca, {
      ...values,
      name: "CA",
      description: "Élu par l’AG.",
    }),
    { name: "CA", description: "Élu par l’AG." },
  );
  const patch = groupFormToPatch(ca, { ...values, visibility: "members" });
  assert.deepEqual(patch, { visibility: "members" });
  assert.equal(parseGroupInput(patch, true).ok, true);
}
{
  // A kind the form doesn't offer is kept: the form shows « autre » but
  // never sends it.
  const ensemble = { ...ca, kind: "ensemble" as const, icon: "unknown-icon" };
  const values = groupFormDefaults(ensemble);
  assert.equal(values.kind, "autre");
  assert.equal(values.icon, "users", "an unknown icon falls back");
  assert.equal("kind" in groupFormToPatch(ensemble, values), false);
}

assert.equal(
  memberTitleSchema.safeParse({ title: " Trésorière " }).data?.title,
  "Trésorière",
);
assert.equal(
  memberTitleSchema.safeParse({ title: "x".repeat(61) }).success,
  false,
);

console.log("groups form: all tests passed");
