// What the concerts and tours routes may write (#489). Like the campaign
// routes before #481, they used to spread the request body into `.insert()`
// and `.update()`, so an admin could set any column (ids, `created_by`,
// timestamps). Each schema lists the columns the « Concerts et tournées »
// screen sends today (app/dashboard/public/concerts/prochains-concerts/page.tsx):
// the concert and tour dialogs, and `{ id, tour_id }` from « Gérer les
// concerts ». Unknown keys are refused with their names (parsePatchBody).
//
// Types follow packages/domain/src/database.types.ts: a column is nullable
// here only when it is nullable there and the UI sends `null` for it.
import { z } from "zod";

const id = z.guid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const required = z.string().trim().min(1);
const NO_CHANGE = "Aucun champ à modifier";

const concertFields = {
  place: required,
  date: isoDate,
  time: required,
  context: required,
  name: z.string().nullable(),
  additional_informations: z.string().nullable(),
  related_link: z.string().nullable(),
  tour_id: id.nullable(),
  affiche: z.string().nullable(),
};

const tourFields = {
  name: required,
  description: z.string().nullable(),
  context: required,
  start_date: isoDate.nullable(),
  end_date: isoDate.nullable(),
  tour_poster: z.string().nullable(),
  is_active: z.boolean(),
};

/** POST /api/prochains-concerts: place, date, time and context required. */
export const concertCreateSchema = z
  .object({
    ...concertFields,
    name: concertFields.name.optional(),
    additional_informations: concertFields.additional_informations.optional(),
    related_link: concertFields.related_link.optional(),
    tour_id: concertFields.tour_id.optional(),
    affiche: concertFields.affiche.optional(),
  })
  .strict();

/** PATCH /api/prochains-concerts: `id` and at least one field. */
export const concertPatchSchema = z
  .object({ id, ...partial(concertFields) })
  .strict()
  .refine((body) => Object.keys(body).length > 1, { message: NO_CHANGE });

/** POST /api/tours: name and context required. */
export const tourCreateSchema = z
  .object({
    name: tourFields.name,
    context: tourFields.context,
    description: tourFields.description.optional(),
    start_date: tourFields.start_date.optional(),
    end_date: tourFields.end_date.optional(),
    tour_poster: tourFields.tour_poster.optional(),
    is_active: tourFields.is_active.optional(),
  })
  .strict();

/** PATCH /api/tours: `id` and at least one field. */
export const tourPatchSchema = z
  .object({ id, ...partial(tourFields) })
  .strict()
  .refine((body) => Object.keys(body).length > 1, { message: NO_CHANGE });

function partial<T extends Record<string, z.ZodType>>(fields: T) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, schema]) => [key, schema.optional()]),
  ) as { [K in keyof T]: z.ZodOptional<T[K]> };
}
