// utils/mailing-list/schemas.ts — request bodies of the comparison routes.
import { z } from "zod";

const address = z
  .string()
  .trim()
  .toLowerCase()
  .max(320)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Adresse invalide");

export const toggleComparisonSchema = z.object({
  groupEmail: address,
  enabled: z.boolean(),
});

export const addExceptionSchema = z.object({
  groupEmail: address,
  email: address,
  note: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((note) => note || null),
});

export const removeExceptionSchema = z.object({
  groupEmail: address,
  email: address,
});

/** 42P01 / PGRST205: the migration isn't applied on this database yet. */
export function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export const NOT_INSTALLED_MESSAGE =
  "La comparaison avec le tableau des membres n'est pas encore installée sur cette base.";
