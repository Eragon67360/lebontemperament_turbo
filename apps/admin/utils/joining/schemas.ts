// What the « Rejoindre et FAQ » routes accept. Same limits as the tables'
// CHECK constraints (supabase/migrations/20261009020100_faq_and_joining.sql)
// and @repo/domain/utils/joiningContent; unknown keys are refused.
import {
  FAQ_ANSWER_MAX,
  FAQ_LINK_LABEL_MAX,
  FAQ_LINK_MAX,
  FAQ_QUESTION_MAX,
  SITE_LINK_PATTERN,
  SLOT_DAY_MAX,
  SLOT_GROUP_MAX,
  SLOT_PLACE_MAX,
  SLOT_RHYTHM_MAX,
  SLOT_TIME_MAX,
} from "@repo/domain/utils/joiningContent";
import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const sortOrder = z.number().int().min(-100000).max(100000);
const status = z.enum(["published", "archived"]);

/** A link and its label come together, or not at all. */
const linked = (body: {
  link_href?: string | null;
  link_label?: string | null;
}) =>
  (body.link_href === undefined) === (body.link_label === undefined) &&
  (body.link_href === null) === (body.link_label === null);
const LINK_MESSAGE = "Le lien et son texte vont ensemble";

const faqFields = {
  question: text(FAQ_QUESTION_MAX),
  answer: text(FAQ_ANSWER_MAX),
  link_href: z
    .string()
    .trim()
    .max(FAQ_LINK_MAX)
    .regex(SITE_LINK_PATTERN)
    .nullable(),
  link_label: text(FAQ_LINK_LABEL_MAX).nullable(),
  sort_order: sortOrder,
  status,
};

export const faqCreateSchema = z
  .object({
    ...faqFields,
    sort_order: sortOrder.optional(),
    status: status.optional(),
  })
  .strict()
  .refine(linked, { message: LINK_MESSAGE });

export const faqPatchSchema = z
  .object(faqFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Aucun champ à modifier",
  })
  .refine(linked, { message: LINK_MESSAGE });

const slotFields = {
  group_name: text(SLOT_GROUP_MAX),
  day: text(SLOT_DAY_MAX),
  time_label: text(SLOT_TIME_MAX),
  place: text(SLOT_PLACE_MAX),
  rhythm: text(SLOT_RHYTHM_MAX),
  sort_order: sortOrder,
  status,
};

export const slotCreateSchema = z
  .object({
    ...slotFields,
    sort_order: sortOrder.optional(),
    status: status.optional(),
  })
  .strict();

export const slotPatchSchema = z
  .object(slotFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Aucun champ à modifier",
  });

/** Explicit columns, no `select("*")`. */
export const FAQ_COLUMNS =
  "id, question, answer, link_href, link_label, sort_order, status, updated_at" as const;
export const SLOT_COLUMNS =
  "id, group_name, day, time_label, place, rhythm, sort_order, status, updated_at" as const;
