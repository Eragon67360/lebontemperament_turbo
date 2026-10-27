// What the « Comptes rendus du CA » routes may write (CODE-004). POST and
// PATCH /api/cas used to spread the request body into `.insert()` and
// `.update()`, so an admin could set any column (ids, timestamps). Each schema
// lists the columns the page sends (app/dashboard/admin/ca/page.tsx:
// `{ title, date_from, file_url }`, the file's address from /api/upload);
// `created_by` is the signed-in admin, set by the route. Unknown keys are
// refused with their names (parsePatchBody).
import { z } from "zod";
import { idBody, isoDate, requiredText, rowPatch } from "../apiFields";

const caFields = {
  title: requiredText,
  date_from: isoDate,
  /** The PDF's public address; the website links to it. */
  file_url: z.url({ protocol: /^https?$/ }).nullable(),
};

/** POST /api/cas: a title and the meeting's date; the PDF is optional. */
export const caCreateSchema = z
  .object({
    title: caFields.title,
    date_from: caFields.date_from,
    file_url: caFields.file_url.optional(),
  })
  .strict();

/** PATCH /api/cas: `id` and at least one field (no screen sends it today). */
export const caPatchSchema = rowPatch(caFields);

/** DELETE /api/cas: `{ id }`. */
export const caDeleteSchema = idBody;
