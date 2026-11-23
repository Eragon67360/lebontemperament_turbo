// « Nouveau groupe » / « Modifier le groupe »: the form's rules (the same
// limits as the server's parseGroupInput) and what it sends. Pure and
// unit-tested (form.test.ts).
import {
  GROUP_COLORS,
  GROUP_ICONS,
  GROUP_VISIBILITIES,
  PICKABLE_GROUP_KINDS,
  type MemberGroup,
} from "@repo/domain/types/memberGroups";
import {
  GROUP_DESCRIPTION_MAX,
  GROUP_MEMBER_TITLE_MAX,
  GROUP_NAME_MAX,
  type GroupInput,
  type GroupPatch,
} from "@repo/domain/utils/memberGroups";
import { z } from "zod";

export const groupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire")
    .max(GROUP_NAME_MAX, `${GROUP_NAME_MAX} caractères au plus`),
  kind: z.enum(PICKABLE_GROUP_KINDS, { error: "Choisissez un type" }),
  description: z
    .string()
    .trim()
    .max(GROUP_DESCRIPTION_MAX, `${GROUP_DESCRIPTION_MAX} caractères au plus`),
  visibility: z.enum(GROUP_VISIBILITIES),
  color: z.enum(GROUP_COLORS),
  icon: z.enum(GROUP_ICONS),
});
export type GroupFormValues = z.output<typeof groupFormSchema>;

const pickable = (kind: string): kind is GroupFormValues["kind"] =>
  (PICKABLE_GROUP_KINDS as readonly string[]).includes(kind);
const knownIcon = (icon: string): icon is GroupFormValues["icon"] =>
  (GROUP_ICONS as readonly string[]).includes(icon);

/**
 * A new group starts private (only its members and the admins see it) with
 * the teal tint and the people icon; an edit starts from the group.
 */
export function groupFormDefaults(group: MemberGroup | null): GroupFormValues {
  if (!group) {
    return {
      name: "",
      kind: "commission",
      description: "",
      visibility: "private",
      color: "teal",
      icon: "users",
    };
  }
  return {
    name: group.name,
    kind: pickable(group.kind) ? group.kind : "autre",
    description: group.description ?? "",
    visibility: group.visibility,
    color: group.color,
    icon: knownIcon(group.icon) ? group.icon : "users",
  };
}

/** POST /api/groups. */
export function groupFormToBody(values: GroupFormValues): GroupInput {
  return {
    name: values.name.trim(),
    kind: values.kind,
    description: values.description.trim() || null,
    color: values.color,
    icon: values.icon,
    visibility: values.visibility,
  };
}

/**
 * PATCH /api/groups/[id]: only what changed (nothing for an untouched
 * form). A group of a kind the form doesn't offer (« ensemble ») keeps it.
 */
export function groupFormToPatch(
  group: MemberGroup,
  values: GroupFormValues,
): GroupPatch {
  const body = groupFormToBody(values);
  const patch: GroupPatch = {};
  if (body.name !== group.name) patch.name = body.name;
  if (pickable(group.kind) && body.kind !== group.kind) patch.kind = body.kind;
  if (body.description !== (group.description ?? null)) {
    patch.description = body.description;
  }
  if (body.color !== group.color) patch.color = body.color;
  if (body.icon !== group.icon) patch.icon = body.icon;
  if (body.visibility !== group.visibility) patch.visibility = body.visibility;
  return patch;
}

/** « Fonction dans le groupe » (« Trésorière »): empty removes it. */
export const memberTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .max(
      GROUP_MEMBER_TITLE_MAX,
      `${GROUP_MEMBER_TITLE_MAX} caractères au plus`,
    ),
});
