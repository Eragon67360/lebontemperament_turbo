// What each « Campagne 40 ans » PATCH route may write (#471). The routes used
// to spread the request body into `.update()`, so any admin could set any
// column (ids, timestamps, columns the dialogs never show). Each schema lists
// the row's `id` and the columns the admin UI edits today: the dialog fields
// (utils/formSchemas.ts), `is_visible` from « Masquer / Afficher »
// (components/anniversary/useListActions.ts), `display_order` from the reorder
// hook (hooks/useAnniversaryReorder.ts) and the memories' moderation flags.
// Unknown keys are refused, never dropped silently, so a client that sends a
// column by mistake hears about it. Server-owned columns (`id` as a value,
// `created_at`, `updated_at`) are never written.
//
// Types follow packages/domain/src/database.types.ts: a column is nullable here
// only when it is nullable there and the UI sends `null` for it.
import { ARCHIVE_TYPES } from "@/types/anniversary";
import { z } from "zod";

const id = z.uuid();
const text = z.string();
const flag = z.boolean();
const order = z.number().int().nonnegative();
const year = z.number().int();

const NO_CHANGE = "Aucun champ à modifier";

/** `{ id, …fields }`, every field optional, at least one present. */
function rowPatch<T extends z.ZodRawShape>(fields: T) {
  return z
    .object({ id, ...fields })
    .strict()
    .refine((body) => Object.keys(body).length > 1, { message: NO_CHANGE });
}

/** The singleton rows (hero, form config): no `id`, at least one field. */
function singletonPatch<T extends z.ZodRawShape>(fields: T) {
  return z
    .object(fields)
    .strict()
    .refine((body) => Object.keys(body).length > 0, { message: NO_CHANGE });
}

export const heroPatchSchema = singletonPatch({
  hero_number: text.optional(),
  hero_subtitle: text.optional(),
  description: text.nullable().optional(),
  cta_text: text.optional(),
  cta_target_section: text.optional(),
  enable_intro_animation: flag.optional(),
  skip_button_text: text.optional(),
});

export const formConfigPatchSchema = singletonPatch({
  section_title: text.optional(),
  section_description: text.optional(),
  name_label: text.optional(),
  email_label: text.optional(),
  message_label: text.optional(),
  year_label: text.optional(),
  submit_button_text: text.optional(),
  success_message: text.optional(),
  is_enabled: flag.optional(),
});

export const heroStatPatchSchema = rowPatch({
  icon_name: text.optional(),
  number: text.optional(),
  label: text.optional(),
  display_order: order.optional(),
  is_visible: flag.optional(),
});

export const navigationCardPatchSchema = rowPatch({
  title: text.optional(),
  description: text.optional(),
  icon_name: text.optional(),
  target_section_id: text.optional(),
  display_order: order.optional(),
  is_visible: flag.optional(),
});

export const timelineEventPatchSchema = rowPatch({
  year: year.optional(),
  title: text.optional(),
  description: text.optional(),
  icon_name: text.optional(),
  display_order: order.optional(),
  is_visible: flag.optional(),
});

export const videoPatchSchema = rowPatch({
  title: text.optional(),
  description: text.optional(),
  thumbnail_url: text.optional(),
  video_url: text.nullable().optional(),
  year: year.nullable().optional(),
  category: text.optional(),
  display_order: order.optional(),
  is_visible: flag.optional(),
});

export const audioMemoryPatchSchema = rowPatch({
  title: text.optional(),
  description: text.optional(),
  speaker_name: text.nullable().optional(),
  year: year.nullable().optional(),
  duration: text.optional(),
  audio_url: text.optional(),
  display_order: order.optional(),
  is_visible: flag.optional(),
});

export const photoPatchSchema = rowPatch({
  title: text.optional(),
  description: text.nullable().optional(),
  year: year.nullable().optional(),
  category: text.optional(),
  image_url: text.optional(),
  display_order: order.optional(),
  is_visible: flag.optional(),
});

// Archives have no display order; `type` keeps the check the route had.
export const archivePatchSchema = rowPatch({
  title: text.optional(),
  description: text.optional(),
  year: year.optional(),
  type: z.enum(ARCHIVE_TYPES).optional(),
  theme: text.optional(),
  file_url: text.optional(),
  file_size: text.optional(),
  is_visible: flag.optional(),
});

// Moderation only: the visitor's name, email, message and year stay as sent.
export const memoryPatchSchema = rowPatch({
  is_approved: flag.optional(),
  is_featured: flag.optional(),
});

export type PatchParse<T> =
  { ok: true; data: T } | { ok: false; status: 400; error: string };

/**
 * Parses a PATCH body against its route's schema. Unknown keys answer
 * « Champs non modifiables : … » (the keys named), wrong types « Champs
 * invalides : … », anything that is not an object « Corps de requête
 * invalide ». The messages are what the admin's toasts show.
 */
export function parsePatchBody<S extends z.ZodType>(
  schema: S,
  body: unknown,
): PatchParse<z.output<S>> {
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };

  const unknownKeys = result.error.issues.flatMap((issue) =>
    issue.code === "unrecognized_keys" ? issue.keys : [],
  );
  if (unknownKeys.length > 0) {
    return {
      ok: false,
      status: 400,
      error: `Champs non modifiables : ${unknownKeys.join(", ")}`,
    };
  }

  const fields = [
    ...new Set(
      result.error.issues
        .map((issue) => issue.path.map(String).join("."))
        .filter((path) => path !== ""),
    ),
  ];
  if (fields.length > 0) {
    return {
      ok: false,
      status: 400,
      error: `Champs invalides : ${fields.join(", ")}`,
    };
  }

  const rootMessage = result.error.issues.find(
    (issue) => issue.path.length === 0 && issue.code === "custom",
  )?.message;
  return {
    ok: false,
    status: 400,
    error: rootMessage ?? "Corps de requête invalide",
  };
}

/** The body of a request as JSON, or `undefined` when it is not valid JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
