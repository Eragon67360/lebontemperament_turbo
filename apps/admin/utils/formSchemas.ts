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
