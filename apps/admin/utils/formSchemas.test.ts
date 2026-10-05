import assert from "node:assert/strict";
import { z } from "zod";
import {
  addUserFormSchema,
  concertFormSchema,
  editUserFormSchema,
  eventFormSchema,
  firstIssueMessage,
  galleryVideoFormSchema,
  invitationEntrySchema,
  projectFormSchema,
  slugify,
  tourFormSchema,
} from "./formSchemas";

/** Messages of a failed parse, keyed by field path. */
function errorsOf(schema: z.ZodType, input: unknown): Record<string, string> {
  const result = schema.safeParse(input);
  assert.equal(result.success, false, "expected the parse to fail");
  const out: Record<string, string> = {};
  for (const issue of result.error!.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Each required field, missing on its own, fails with its French message. */
function assertRequired<T extends Record<string, unknown>>(
  schema: z.ZodType,
  valid: T,
  expectations: Partial<Record<keyof T, string>>,
) {
  assert.equal(schema.safeParse(valid).success, true, "valid input passes");
  for (const [field, message] of Object.entries(expectations)) {
    const { [field]: _omitted, ...without } = valid;
    void _omitted;
    const missing = errorsOf(schema, without);
    assert.equal(missing[field], message, `${field} missing (undefined)`);
    if (typeof valid[field] === "string") {
      const empty = errorsOf(schema, { ...valid, [field]: "" });
      assert.equal(empty[field], message, `${field} empty`);
    }
  }
}

// --- Concerts ---
const concert = {
  concertName: "",
  place: "Salle des fêtes",
  date: new Date("2026-12-24"),
  time: "20:30",
  context: "choeur",
  tour_id: "",
  additional_informations: "",
  related_link: "",
};
assertRequired(concertFormSchema, concert, {
  place: "Le lieu est requis",
  date: "La date est requise",
  time: "L'heure est requise",
  context: "Le type de concert est requis",
});
assert.equal(
  errorsOf(concertFormSchema, { ...concert, time: "8h30" }).time,
  "Heure invalide (HH:MM)",
);
assert.equal(
  errorsOf(concertFormSchema, { ...concert, context: "fanfare" }).context,
  "Le type de concert est requis",
);
// The ticket link must be an address the site can open; empty stays allowed.
assert.match(
  errorsOf(concertFormSchema, {
    ...concert,
    related_link: "billetterie.example.org",
  }).related_link ?? "",
  /https:\/\//,
);
assert.equal(
  concertFormSchema.safeParse({
    ...concert,
    related_link: "https://billetterie.example.org/concert",
    tour_id: "00000000-0000-0000-0000-000000000000",
  }).success,
  true,
);
{
  const parsed = concertFormSchema.parse(concert);
  assert.equal(parsed.concertName, ""); // optional fields pass through as-is
  assert.equal(parsed.context, "choeur");
}

// --- Gallery videos (#480): a URL or a bare id, nothing else ---
const galleryVideo = {
  title: "Requiem",
  composer: "Fauré",
  youtube_url: "https://youtu.be/dQw4w9WgXcQ",
  performance_date: new Date("2025-06-01"),
  venue: "Église Saint-Test",
  soloists: "",
};
assertRequired(galleryVideoFormSchema, galleryVideo, {
  title: "Le titre est requis",
  composer: "Le compositeur est requis",
  youtube_url: "Le lien YouTube est requis",
  performance_date: "La date est requise",
  venue: "Le lieu est requis",
});
assert.equal(
  galleryVideoFormSchema.safeParse({
    ...galleryVideo,
    youtube_url: "dQw4w9WgXcQ",
  }).success,
  true,
  "a bare id is accepted, as the hint says",
);
assert.match(
  errorsOf(galleryVideoFormSchema, {
    ...galleryVideo,
    youtube_url: "https://vimeo.com/1234",
  }).youtube_url ?? "",
  /YouTube/,
);

// --- Concert stories (#480) ---
assert.equal(slugify("Concert de Noël 2024 !"), "concert-de-noel-2024");
const story = {
  name: "Concert de Noël",
  sub_name: "",
  slug: "concert-de-noel-2024",
  date: new Date("2024-12-15"),
  author_name: "",
  explanation: "",
  text1: "",
  text2: "",
  banniere_photographer_name: "",
  banniere_photographer_url: "",
  image2_photographer_name: "",
  image2_photographer_url: "",
  image3_photographer_name: "",
  image3_photographer_url: "",
};
assertRequired(projectFormSchema, story, {
  name: "Le nom est requis",
  slug: "L'adresse de la page est requise",
  date: "La date est requise",
});
assert.match(
  errorsOf(projectFormSchema, { ...story, slug: "Concert de Noël" }).slug ?? "",
  /minuscules/,
);
assert.match(
  errorsOf(projectFormSchema, {
    ...story,
    banniere_photographer_url: "photographe.example.org",
  }).banniere_photographer_url ?? "",
  /https:\/\//,
);
assert.equal(projectFormSchema.safeParse(story).success, true);

// --- Events ---
const event = {
  title: "Répétition générale",
  date_from: new Date("2026-11-02"),
  date_to: undefined,
  time: "19:00",
  location: "Église Saint-Test",
  responsible_name: "Responsable Test",
  responsible_email: "",
  event_type: "repetition",
  link: "",
  description: "",
  is_public: false,
};
assertRequired(eventFormSchema, event, {
  title: "Le titre est requis",
  date_from: "La date de début est requise",
  time: "L'heure est requise",
  location: "Le lieu est requis",
  responsible_name: "Le responsable est requis",
  event_type: "Le type d'événement est requis",
});
assert.equal(
  eventFormSchema.safeParse({ ...event, date_to: new Date("2026-11-03") })
    .success,
  true,
);
assert.equal(
  eventFormSchema.safeParse({ ...event, responsible_email: "chef@example.com" })
    .success,
  true,
);
assert.equal(
  errorsOf(eventFormSchema, { ...event, responsible_email: "pas-un-email" })
    .responsible_email,
  "Email invalide",
);
assert.equal(
  errorsOf(eventFormSchema, { ...event, is_public: "on" }).is_public !==
    undefined,
  true,
);

// --- Tours ---
const tour = {
  tourName: "Tournée d'été",
  description: "",
  context: "orchestre",
  start_date: undefined,
  end_date: undefined,
};
assertRequired(tourFormSchema, tour, {
  tourName: "Le nom de la tournée est requis",
  context: "Le type est requis",
});
assert.equal(
  tourFormSchema.safeParse({
    ...tour,
    start_date: new Date("2026-07-01"),
    end_date: new Date("2026-07-10"),
  }).success,
  true,
);

// --- Users ---
const newUser = {
  display_name: "",
  email: "member@example.com",
  password: "test".repeat(6),
  role: "user",
};
assertRequired(addUserFormSchema, newUser, {
  email: "L'email est requis",
  password: "Le mot de passe est requis",
  role: "Le rôle est requis",
});
assert.equal(
  errorsOf(addUserFormSchema, { ...newUser, email: "member@" }).email,
  "Format d'email invalide",
);
assert.equal(
  errorsOf(addUserFormSchema, { ...newUser, role: "superadmin" }).role,
  "Le rôle est requis",
);
assert.equal(
  addUserFormSchema.safeParse({ ...newUser, role: "admin" }).success,
  true,
);

assert.equal(editUserFormSchema.safeParse({ display_name: "" }).success, true);
assert.equal(
  editUserFormSchema.safeParse({ display_name: "Membre Test" }).success,
  true,
);
assert.equal(editUserFormSchema.safeParse({}).success, false);

// --- Invitations: email checked before the name, like the dialog did ---
assert.equal(
  invitationEntrySchema.safeParse({
    email: "invite@example.com",
    displayName: "Invitée Test",
  }).success,
  true,
);
{
  const bad = invitationEntrySchema.safeParse({
    email: "nope",
    displayName: "",
  });
  assert.equal(bad.success, false);
  assert.equal(firstIssueMessage(bad.error!), "Format d'email invalide");
}
{
  const noName = invitationEntrySchema.safeParse({
    email: "invite@example.com",
    displayName: "",
  });
  assert.equal(noName.success, false);
  assert.equal(firstIssueMessage(noName.error!), "Le nom complet est requis");
}

console.log("formSchemas: ok");
