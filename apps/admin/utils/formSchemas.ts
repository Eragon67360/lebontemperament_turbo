// Zod schemas of the admin forms that show inline errors (react-hook-form +
// components/ui/form.tsx). They mirror the forms' existing requirements: what
// was a native `required` attribute (or a NOT NULL column the API passes
// through) is now an explicit rule with a French message. No new rules.
import { z } from "zod";

export const CONTEXTS = [
  "orchestre",
  "choeur",
  "orchestre_et_choeur",
  "autre",
] as const;

export const EVENT_TYPES = [
  "concert",
  "repetition",
  "sejour",
  "vente",
  "autre",
] as const;

const TIME_PATTERN = /^\d{2}:\d{2}$/; // what <input type="time"> emits

const requiredString = (message: string) =>
  z.string({ error: message }).min(1, message);
const requiredTime = (message: string) =>
  requiredString(message).regex(TIME_PATTERN, "Heure invalide (HH:MM)");
/** Optional email: empty is fine, anything else must be an email. */
const optionalEmail = z.union([z.literal(""), z.email("Email invalide")]);

export const concertFormSchema = z.object({
  concertName: z.string(),
  place: requiredString("Le lieu est requis"),
  date: z.date({ error: "La date est requise" }),
  time: requiredTime("L'heure est requise"),
  context: z.enum(CONTEXTS, { error: "Le contexte est requis" }),
  additional_informations: z.string(),
  related_link: z.string(),
});
export type ConcertFormValues = z.output<typeof concertFormSchema>;

export const eventFormSchema = z.object({
  title: requiredString("Le titre est requis"),
  date_from: z.date({ error: "La date de début est requise" }),
  date_to: z.date().optional(),
  time: requiredTime("L'heure est requise"),
  location: requiredString("Le lieu est requis"),
  responsible_name: requiredString("Le responsable est requis"),
  responsible_email: optionalEmail,
  event_type: z.enum(EVENT_TYPES, {
    error: "Le type d'événement est requis",
  }),
  link: z.string(),
  description: z.string(),
  is_public: z.boolean(),
});
export type EventFormValues = z.output<typeof eventFormSchema>;

export const tourFormSchema = z.object({
  tourName: requiredString("Le nom de la tournée est requis"),
  description: z.string(),
  context: z.enum(CONTEXTS, { error: "Le type est requis" }),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});
export type TourFormValues = z.output<typeof tourFormSchema>;

export const addUserFormSchema = z.object({
  display_name: z.string(),
  email: requiredString("L'email est requis").pipe(
    z.email("Format d'email invalide"),
  ),
  password: requiredString("Le mot de passe est requis"),
  role: z.enum(["user", "admin"], { error: "Le rôle est requis" }),
});
export type AddUserFormValues = z.output<typeof addUserFormSchema>;

export const editUserFormSchema = z.object({
  display_name: z.string(),
});
export type EditUserFormValues = z.output<typeof editUserFormSchema>;

/** One row of the invitation list (InviteUsersDialog). */
export const invitationEntrySchema = z.object({
  email: z.email("Format d'email invalide"),
  displayName: requiredString("Le nom complet est requis"),
});

/** The first error message of a failed parse, in the schema's field order. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides";
}

// --- Campagne 40 ans (Phase 4 wave 1, #464) ---
// What used to be a native `required` or a NOT NULL column the API checks is
// an explicit rule with a French message. Year fields take the input's text
// ("" or digits) and come out as a number, so a cleared field never sends NaN.

import {
  ARCHIVE_TYPES,
  ICON_OPTIONS,
  PHOTO_CATEGORIES,
  VIDEO_CATEGORIES,
} from "@/types/anniversary";
import { SECTION_IDS } from "./anniversary/sections";

const YEAR_MIN = 1984;
const YEAR_MAX = 2100;
const YEAR_RANGE = `L'année doit être comprise entre ${YEAR_MIN} et ${YEAR_MAX}`;

const YEAR_NOT_A_NUMBER = "L'année doit être un nombre, par exemple 1998";

const yearNumber = (missing?: string) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined && missing ? missing : YEAR_NOT_A_NUMBER,
    })
    .int("L'année doit être un nombre entier")
    .min(YEAR_MIN, YEAR_RANGE)
    .max(YEAR_MAX, YEAR_RANGE);

const yearInput = (value: unknown, empty: null | undefined) =>
  value === "" || value === null || value === undefined
    ? empty
    : typeof value === "string"
      ? Number(value.trim())
      : value;

/** "" | "1998" | 1998 → number; empty is refused with `message`. */
const requiredYear = (message: string) =>
  z.preprocess(
    (value) => yearInput(value, undefined),
    yearNumber(message),
  ) as unknown as z.ZodType<number, string | number | null | undefined>;

/** "" | "1998" | 1998 | null → number | null. */
const optionalYear = z.preprocess(
  (value) => yearInput(value, null),
  yearNumber().nullable(),
) as unknown as z.ZodType<number | null, string | number | null | undefined>;

const iconName = z.enum(ICON_OPTIONS, { error: "Choisissez une icône" });
const sectionId = z.enum(SECTION_IDS as [string, ...string[]], {
  error: "Choisissez la section de la page vers laquelle mener",
});
/** Optional link: empty, or a full address. */
const optionalUrl = z.union([
  z.literal(""),
  z.url({
    error:
      "Le lien doit être une adresse complète, par exemple https://youtube.com/…",
  }),
]);

export const heroStatFormSchema = z.object({
  icon_name: iconName,
  number: requiredString("Le chiffre est requis").max(
    20,
    "Le chiffre fait 20 caractères au plus",
  ),
  label: requiredString("Le libellé est requis").max(
    100,
    "Le libellé fait 100 caractères au plus",
  ),
  is_visible: z.boolean(),
});
export type HeroStatFormValues = z.output<typeof heroStatFormSchema>;

export const navigationCardFormSchema = z.object({
  title: requiredString("Le titre est requis"),
  description: requiredString("La description est requise"),
  icon_name: iconName,
  target_section_id: sectionId,
  is_visible: z.boolean(),
});
export type NavigationCardFormValues = z.output<
  typeof navigationCardFormSchema
>;

export const timelineEventFormSchema = z.object({
  year: requiredYear("L'année est requise"),
  title: requiredString("Le titre est requis"),
  description: requiredString("La description est requise"),
  icon_name: iconName,
  is_visible: z.boolean(),
});
export type TimelineEventFormInput = z.input<typeof timelineEventFormSchema>;
export type TimelineEventFormValues = z.output<typeof timelineEventFormSchema>;

export const videoFormSchema = z.object({
  thumbnail_url: requiredString("Ajoutez une miniature"),
  title: requiredString("Le titre est requis"),
  description: requiredString("La description est requise"),
  video_url: optionalUrl,
  year: optionalYear,
  category: z.enum(VIDEO_CATEGORIES, { error: "Choisissez une catégorie" }),
  is_visible: z.boolean(),
});
export type VideoFormInput = z.input<typeof videoFormSchema>;
export type VideoFormValues = z.output<typeof videoFormSchema>;

const DURATION_PATTERN = /^\d{1,3}:[0-5]\d$/;

export const audioMemoryFormSchema = z.object({
  audio_url: requiredString("Ajoutez un fichier audio"),
  title: requiredString("Le titre est requis"),
  description: requiredString("La description est requise"),
  speaker_name: z.string(),
  year: optionalYear,
  duration: requiredString("La durée est requise").regex(
    DURATION_PATTERN,
    "Indiquez la durée en minutes:secondes, par exemple 5:32",
  ),
  is_visible: z.boolean(),
});
export type AudioMemoryFormInput = z.input<typeof audioMemoryFormSchema>;
export type AudioMemoryFormValues = z.output<typeof audioMemoryFormSchema>;

export const photoFormSchema = z.object({
  image_url: requiredString("Ajoutez une photo"),
  title: requiredString("Le titre est requis"),
  description: z.string(),
  year: optionalYear,
  category: z.enum(PHOTO_CATEGORIES, { error: "Choisissez une catégorie" }),
  is_visible: z.boolean(),
});
export type PhotoFormInput = z.input<typeof photoFormSchema>;
export type PhotoFormValues = z.output<typeof photoFormSchema>;

export const archiveFormSchema = z.object({
  title: requiredString("Le titre est requis"),
  description: requiredString("La description est requise"),
  year: requiredYear("L'année est requise"),
  type: z.enum(ARCHIVE_TYPES, { error: "Choisissez un type de document" }),
  theme: requiredString("Choisissez un thème"),
  file_url: requiredString("Ajoutez un document"),
  file_size: z.string(),
  is_visible: z.boolean(),
});
export type ArchiveFormInput = z.input<typeof archiveFormSchema>;
export type ArchiveFormValues = z.output<typeof archiveFormSchema>;

export const heroFormSchema = z.object({
  hero_number: requiredString("Le chiffre est requis"),
  hero_subtitle: requiredString("Le sous-titre est requis"),
  description: z.string(),
  cta_text: requiredString("Le texte du bouton est requis"),
  cta_target_section: sectionId,
  enable_intro_animation: z.boolean(),
  skip_button_text: requiredString(
    "Le texte du bouton « Passer l'animation » est requis",
  ),
});
export type HeroFormValues = z.output<typeof heroFormSchema>;

export const formConfigFormSchema = z.object({
  section_title: requiredString("Le titre de la section est requis"),
  section_description: requiredString(
    "La description de la section est requise",
  ),
  name_label: requiredString("Le libellé du nom est requis"),
  email_label: requiredString("Le libellé de l'e-mail est requis"),
  message_label: requiredString("Le libellé du message est requis"),
  year_label: requiredString("Le libellé de l'année est requis"),
  submit_button_text: requiredString("Le texte du bouton est requis"),
  success_message: requiredString("Le message de confirmation est requis"),
  is_enabled: z.boolean(),
});
export type FormConfigFormValues = z.output<typeof formConfigFormSchema>;
