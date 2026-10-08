// What the « Assemblée générale » routes accept. Same limits as the table's
// CHECK constraints (supabase/migrations/20261008233100_general_assemblies.sql)
// and @repo/domain/utils/generalAssemblies; unknown keys are refused.
import {
  ASSEMBLY_NOTE_MAX,
  ASSEMBLY_PLACE_MAX,
  ASSEMBLY_TEXT_MAX,
} from "@repo/domain/utils/generalAssemblies";
import { z } from "zod";

/** Empty text is stored as null: the website then leaves the section out. */
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .transform((value) => (value && value.trim() ? value.trim() : null));

const fields = {
  held_at: z.iso.datetime({ offset: true }),
  place: z.string().trim().min(1).max(ASSEMBLY_PLACE_MAX),
  practical_note: optionalText(ASSEMBLY_NOTE_MAX),
  reminders: optionalText(ASSEMBLY_TEXT_MAX),
  voting_rights: optionalText(ASSEMBLY_TEXT_MAX),
  agenda: optionalText(ASSEMBLY_TEXT_MAX),
  afterwards: optionalText(ASSEMBLY_TEXT_MAX),
  convocation_document_id: z.guid().nullable(),
  proxy_document_id: z.guid().nullable(),
  status: z.enum(["draft", "published"]),
};

export const assemblyCreateSchema = z.object(fields).strict();

export const assemblyPatchSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Aucun champ à modifier",
  });

/** Explicit columns, no `select("*")`. */
export const ASSEMBLY_COLUMNS =
  "id, held_at, place, practical_note, reminders, voting_rights, agenda, afterwards, convocation_document_id, proxy_document_id, status, created_at, updated_at" as const;
