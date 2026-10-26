// Field rules shared by the request-body schemas of the admin's API routes
// (CODE-004). Each route parses its body with `parsePatchBody`
// (utils/anniversary/patchSchemas.ts): unknown keys are refused by name, wrong
// types by field, and only what the schema lists reaches the database. The
// concerts and campaign schemas (#471, #489) keep their own copies.
import { z } from "zod";

/** A row id: Postgres `uuid` columns. */
export const id = z.guid();

/** A `date` column as the forms send it: « 2026-10-26 ». */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** A `time` column: « 19:30 » from `<input type="time">`, « 19:30:00 » read back. */
export const clockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

/** A NOT NULL text the form requires: trimmed, never empty. */
export const requiredText = z.string().trim().min(1);

const NO_CHANGE = "Aucun champ à modifier";

function optional<T extends Record<string, z.ZodType>>(fields: T) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, schema]) => [key, schema.optional()]),
  ) as { [K in keyof T]: z.ZodOptional<T[K]> };
}

/** A PATCH body whose row is named in the path: some of `fields`, nothing else. */
export function fieldsPatch<T extends Record<string, z.ZodType>>(fields: T) {
  return z
    .object(optional(fields))
    .strict()
    .refine((body) => Object.keys(body).length > 0, { message: NO_CHANGE });
}

/** A PATCH body naming its row: `{ id, …some of fields }`, nothing else. */
export function rowPatch<T extends Record<string, z.ZodType>>(fields: T) {
  return z
    .object({ id, ...optional(fields) })
    .strict()
    .refine((body) => Object.keys(body).length > 1, { message: NO_CHANGE });
}

/** A DELETE body: `{ id }`. */
export const idBody = z.object({ id }).strict();
