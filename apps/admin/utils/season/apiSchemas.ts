// What the « Saison des membres » routes may write (CODE-004): /api/rehearsals,
// /api/rehearsals/[id] and /api/events. The event routes inserted the body as
// it came and updated with the body minus `id`; the rehearsal routes picked
// their columns but checked no value, so a bad one came back as a 500. Each
// schema lists what the dialogs send, built in utils/season/schedule.ts:
// `toRehearsalPayloads` (one row, or one per date of a weekly series) and
// `toEventPayload`. Unknown keys are refused with their names
// (parsePatchBody); the calendar sync's columns (`event_id`,
// `google_updated_at`) and the timestamps are never written from a body.
//
// Types follow packages/domain/src/database.types.ts and the SQL columns
// (`rehearsals.name` and `place` are varchar(255)).
import { GROUP_TYPES, type GroupType } from "@repo/domain/types/rehearsals";
import { z } from "zod";
import {
  clockTime,
  fieldsPatch,
  idBody,
  isoDate,
  requiredText,
  rowPatch,
} from "../apiFields";
import { EVENT_TYPES } from "../formSchemas";

const rehearsalFields = {
  name: requiredText.max(255),
  place: requiredText.max(255),
  /** The full postal address the app's « Itinéraire » opens. */
  address: z.string().nullable(),
  room: z.string().nullable(),
  date: isoDate,
  start_time: clockTime,
  end_time: clockTime,
  group_type: z.enum(GROUP_TYPES as [GroupType, ...GroupType[]]),
};

/** POST /api/rehearsals with an object: one rehearsal. */
export const rehearsalCreateSchema = z
  .object({
    ...rehearsalFields,
    address: rehearsalFields.address.optional(),
    room: rehearsalFields.room.optional(),
  })
  .strict();

/** POST /api/rehearsals with an array: a weekly series, one row per date. */
export const rehearsalSeriesSchema = z.array(rehearsalCreateSchema).min(1);

/** PATCH /api/rehearsals/[id]: at least one field; the id is in the path. */
export const rehearsalPatchSchema = fieldsPatch(rehearsalFields);

const eventFields = {
  title: requiredText,
  date_from: isoDate,
  date_to: isoDate.nullable(),
  time: clockTime,
  location: requiredText,
  responsible_name: requiredText,
  responsible_email: z.email().nullable(),
  event_type: z.enum(EVENT_TYPES),
  description: z.string().nullable(),
  link: z.string().nullable(),
  is_public: z.boolean(),
};

/** POST /api/events: the NOT NULL columns required, the others optional. */
export const eventCreateSchema = z
  .object({
    title: eventFields.title,
    date_from: eventFields.date_from,
    time: eventFields.time,
    location: eventFields.location,
    responsible_name: eventFields.responsible_name,
    event_type: eventFields.event_type,
    date_to: eventFields.date_to.optional(),
    responsible_email: eventFields.responsible_email.optional(),
    description: eventFields.description.optional(),
    link: eventFields.link.optional(),
    is_public: eventFields.is_public.optional(),
  })
  .strict();

/** PATCH /api/events: `id` and at least one field. */
export const eventPatchSchema = rowPatch(eventFields);

/** DELETE /api/events: `{ id }`. */
export const eventDeleteSchema = idBody;
