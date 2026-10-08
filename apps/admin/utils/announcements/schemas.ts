// What the « Annonces » routes accept. Same limits as the table's CHECK
// constraints (supabase/migrations/20261009020000_site_announcements.sql)
// and @repo/domain/utils/announcements; unknown keys are refused.
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_LINK_LABEL_MAX,
  ANNOUNCEMENT_LINK_MAX,
  ANNOUNCEMENT_LINK_PATTERN,
  ANNOUNCEMENT_PLACEMENTS,
  ANNOUNCEMENT_TITLE_MAX,
} from "@repo/domain/utils/announcements";
import { z } from "zod";

/** Empty text is stored as null. */
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .transform((value) => (value && value.trim() ? value.trim() : null));

const day = z.iso.date().nullable();

const fields = {
  placement: z.enum(ANNOUNCEMENT_PLACEMENTS),
  title: z.string().trim().min(1).max(ANNOUNCEMENT_TITLE_MAX),
  body: optionalText(ANNOUNCEMENT_BODY_MAX),
  link_label: optionalText(ANNOUNCEMENT_LINK_LABEL_MAX),
  link_url: z
    .string()
    .trim()
    .max(ANNOUNCEMENT_LINK_MAX)
    .regex(ANNOUNCEMENT_LINK_PATTERN),
  starts_on: day,
  ends_on: day,
  status: z.enum(["draft", "published", "archived"]),
  sort_order: z.number().int().min(-1000).max(1000),
};

/** The start comes before the end, when both are set. */
const ordered = (body: {
  starts_on?: string | null;
  ends_on?: string | null;
}) => !body.starts_on || !body.ends_on || body.starts_on <= body.ends_on;

const ORDER_MESSAGE = "Le début vient avant la fin";

export const announcementCreateSchema = z
  .object({ ...fields, sort_order: fields.sort_order.optional() })
  .strict()
  .refine(ordered, { message: ORDER_MESSAGE });

export const announcementPatchSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Aucun champ à modifier",
  })
  .refine(ordered, { message: ORDER_MESSAGE });

/** Explicit columns, no `select("*")`. */
export const ANNOUNCEMENT_COLUMNS =
  "id, placement, title, body, link_label, link_url, starts_on, ends_on, status, sort_order, created_at, updated_at" as const;
