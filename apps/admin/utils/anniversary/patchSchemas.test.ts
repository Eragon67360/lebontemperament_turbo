import assert from "node:assert/strict";
import type { z } from "zod";
import {
  archivePatchSchema,
  audioMemoryPatchSchema,
  formConfigPatchSchema,
  heroPatchSchema,
  heroStatPatchSchema,
  memoryPatchSchema,
  navigationCardPatchSchema,
  parsePatchBody,
  photoPatchSchema,
  timelineEventPatchSchema,
  videoPatchSchema,
} from "./patchSchemas";

const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";

function accepts(schema: z.ZodType, body: unknown, label: string) {
  const result = parsePatchBody(schema, body);
  assert.equal(result.ok, true, `${label}: ${JSON.stringify(result)}`);
  if (result.ok) assert.deepEqual(result.data, body, `${label}: data as sent`);
}

function refuses(
  schema: z.ZodType,
  body: unknown,
  error: string | RegExp,
  label: string,
) {
  const result = parsePatchBody(schema, body);
  assert.equal(result.ok, false, `${label}: expected a refusal`);
  if (!result.ok) {
    assert.equal(result.status, 400, label);
    if (typeof error === "string") assert.equal(result.error, error, label);
    else assert.match(result.error, error, label);
  }
}

/** What every row schema must do: the id, the server-owned columns, no-ops. */
function rowSchemaBasics(schema: z.ZodType, name: string, sample: object) {
  // A server-owned column is named in the refusal, whatever else is valid.
  refuses(
    schema,
    { id: ID, ...sample, created_at: "2026-01-01T00:00:00Z" },
    "Champs non modifiables : created_at",
    `${name}: created_at`,
  );
  refuses(
    schema,
    { id: ID, ...sample, updated_at: "2026-01-01T00:00:00Z", email: "x" },
    "Champs non modifiables : updated_at, email",
    `${name}: several unknown keys`,
  );
  refuses(schema, sample, "Champs invalides : id", `${name}: id missing`);
  refuses(
    schema,
    { id: "not-a-uuid", ...sample },
    "Champs invalides : id",
    `${name}: id not a uuid`,
  );
  refuses(
    schema,
    { id: 42, ...sample },
    "Champs invalides : id",
    `${name}: id as number`,
  );
  refuses(
    schema,
    { id: ID },
    "Aucun champ à modifier",
    `${name}: nothing to change`,
  );
  // The reorder hook sends `{ id, display_order }` to every ordered list.
  if ("display_order" in sample) {
    accepts(schema, { id: ID, display_order: 3 }, `${name}: reorder`);
    refuses(
      schema,
      { id: ID, display_order: "3" },
      "Champs invalides : display_order",
      `${name}: display_order as string`,
    );
    refuses(
      schema,
      { id: ID, display_order: 1.5 },
      "Champs invalides : display_order",
      `${name}: display_order not an integer`,
    );
  }
  // « Masquer / Afficher » sends `{ id, is_visible }`.
  if ("is_visible" in sample) {
    accepts(schema, { id: ID, is_visible: false }, `${name}: hide`);
    refuses(
      schema,
      { id: ID, is_visible: "false" },
      "Champs invalides : is_visible",
      `${name}: is_visible as string`,
    );
  }
}

// --- Bodies that are not objects ---
refuses(heroStatPatchSchema, undefined, "Corps de requête invalide", "no body");
refuses(heroStatPatchSchema, null, "Corps de requête invalide", "null body");
refuses(heroStatPatchSchema, "id=1", "Corps de requête invalide", "string");
refuses(heroStatPatchSchema, [ID], "Corps de requête invalide", "array");

// --- Chiffres clés (HeroStatDialog + useListActions + reorder) ---
const heroStat = {
  icon_name: "FaMusic",
  number: "40",
  label: "ans de musique",
  is_visible: true,
};
accepts(heroStatPatchSchema, { id: ID, ...heroStat }, "hero stat: dialog");
rowSchemaBasics(heroStatPatchSchema, "hero stat", {
  ...heroStat,
  display_order: 1,
});
refuses(
  heroStatPatchSchema,
  { id: ID, ...heroStat, number: 40 },
  "Champs invalides : number",
  "hero stat: number must be text",
);

// --- Cartes de navigation (NavigationCardDialog) ---
const card = {
  title: "Vidéos",
  description: "Les concerts filmés",
  icon_name: "FaVideo",
  target_section_id: "videos",
  is_visible: true,
};
accepts(navigationCardPatchSchema, { id: ID, ...card }, "card: dialog");
rowSchemaBasics(navigationCardPatchSchema, "card", {
  ...card,
  display_order: 2,
});
refuses(
  navigationCardPatchSchema,
  { id: ID, ...card, is_visible: 1 },
  "Champs invalides : is_visible",
  "card: is_visible must be boolean",
);

// --- Frise chronologique (TimelineEventDialog) ---
const event = {
  year: 1998,
  title: "Première tournée",
  description: "Un été en Italie",
  icon_name: "FaHistory",
  is_visible: true,
};
accepts(timelineEventPatchSchema, { id: ID, ...event }, "event: dialog");
rowSchemaBasics(timelineEventPatchSchema, "event", {
  ...event,
  display_order: 4,
});
refuses(
  timelineEventPatchSchema,
  { id: ID, ...event, year: "1998" },
  "Champs invalides : year",
  "event: year must be a number",
);
refuses(
  timelineEventPatchSchema,
  { id: ID, ...event, year: null },
  "Champs invalides : year",
  "event: year is not nullable",
);

// --- Vidéos (VideoDialog sends video_url "" → null) ---
const video = {
  thumbnail_url: "anniversary/videos/thumb",
  title: "Concert de Noël",
  description: "Extraits du concert",
  video_url: null,
  year: null,
  category: "Concert",
  is_visible: true,
};
accepts(videoPatchSchema, { id: ID, ...video }, "video: dialog, no link");
accepts(
  videoPatchSchema,
  { id: ID, ...video, video_url: "https://example.com/v", year: 2010 },
  "video: dialog, with link and year",
);
rowSchemaBasics(videoPatchSchema, "video", { ...video, display_order: 1 });
refuses(
  videoPatchSchema,
  { id: ID, ...video, year: "2010" },
  "Champs invalides : year",
  "video: year as string",
);
refuses(
  videoPatchSchema,
  { id: ID, ...video, title: null },
  "Champs invalides : title",
  "video: title not nullable",
);

// --- Témoignages audio (AudioMemoryDialog sends speaker_name "" → null) ---
const audio = {
  audio_url: "anniversary/audio/voice",
  title: "Souvenir de répétition",
  description: "Une anecdote",
  speaker_name: null,
  year: 2005,
  duration: "5:32",
  is_visible: true,
};
accepts(audioMemoryPatchSchema, { id: ID, ...audio }, "audio: dialog");
accepts(
  audioMemoryPatchSchema,
  { id: ID, ...audio, speaker_name: "Un choriste" },
  "audio: dialog, with a speaker",
);
rowSchemaBasics(audioMemoryPatchSchema, "audio", {
  ...audio,
  display_order: 1,
});
refuses(
  audioMemoryPatchSchema,
  { id: ID, ...audio, duration: 332 },
  "Champs invalides : duration",
  "audio: duration is text",
);

// --- Photos (PhotoDialog sends description "" → null) ---
const photo = {
  image_url: "anniversary/photos/pic",
  title: "Sur scène",
  description: null,
  year: null,
  category: "Concert",
  is_visible: true,
};
accepts(photoPatchSchema, { id: ID, ...photo }, "photo: dialog");
rowSchemaBasics(photoPatchSchema, "photo", { ...photo, display_order: 1 });
refuses(
  photoPatchSchema,
  { id: ID, ...photo, image_url: null },
  "Champs invalides : image_url",
  "photo: image_url not nullable",
);

// --- Archives (ArchiveDialog; no display_order column) ---
const archive = {
  title: "Rapport annuel 2010",
  description: "Le bilan de la saison",
  year: 2010,
  type: "rapport-annuel",
  theme: "Bilan",
  file_url: "anniversary/archives/doc",
  file_size: "1.2 MB",
  is_visible: true,
};
accepts(archivePatchSchema, { id: ID, ...archive }, "archive: dialog");
rowSchemaBasics(archivePatchSchema, "archive", archive);
refuses(
  archivePatchSchema,
  { id: ID, display_order: 1 },
  "Champs non modifiables : display_order",
  "archive: no display order",
);
refuses(
  archivePatchSchema,
  { id: ID, type: "brochure" },
  "Champs invalides : type",
  "archive: type outside the list",
);

// --- Témoignages écrits (moderation only) ---
accepts(memoryPatchSchema, { id: ID, is_approved: true }, "memory: publish");
accepts(
  memoryPatchSchema,
  { id: ID, is_approved: false, is_featured: false },
  "memory: unpublish",
);
accepts(memoryPatchSchema, { id: ID, is_featured: true }, "memory: feature");
rowSchemaBasics(memoryPatchSchema, "memory", { is_approved: true });
refuses(
  memoryPatchSchema,
  { id: ID, is_approved: true, message: "edited", name: "someone" },
  "Champs non modifiables : message, name",
  "memory: the visitor's text is not editable",
);
refuses(
  memoryPatchSchema,
  { id: ID, is_approved: "yes" },
  "Champs invalides : is_approved",
  "memory: flag as string",
);

// --- En-tête (HeroInlineEditor, singleton: no id) ---
const hero = {
  hero_number: "40",
  hero_subtitle: "Années de passion",
  description: "",
  cta_text: "Découvrir",
  cta_target_section: "timeline",
  enable_intro_animation: true,
  skip_button_text: "Passer l'animation",
};
accepts(heroPatchSchema, hero, "hero: inline editor");
accepts(heroPatchSchema, { description: null }, "hero: null description");
refuses(
  heroPatchSchema,
  { ...hero, id: ID },
  "Champs non modifiables : id",
  "hero: the singleton takes no id",
);
refuses(
  heroPatchSchema,
  { ...hero, created_at: "2026-01-01T00:00:00Z" },
  "Champs non modifiables : created_at",
  "hero: created_at",
);
refuses(heroPatchSchema, {}, "Aucun champ à modifier", "hero: empty body");
refuses(
  heroPatchSchema,
  { ...hero, enable_intro_animation: "true" },
  "Champs invalides : enable_intro_animation",
  "hero: flag as string",
);

// --- Formulaire (FormConfigInlineEditor, singleton: no id) ---
const formConfig = {
  section_title: "Partagez vos souvenirs",
  section_description: "Racontez-nous",
  name_label: "Nom",
  email_label: "E-mail",
  message_label: "Message",
  year_label: "Année",
  submit_button_text: "Envoyer",
  success_message: "Merci !",
  is_enabled: true,
};
accepts(formConfigPatchSchema, formConfig, "form config: inline editor");
refuses(
  formConfigPatchSchema,
  { ...formConfig, updated_at: "2026-01-01T00:00:00Z" },
  "Champs non modifiables : updated_at",
  "form config: updated_at",
);
refuses(
  formConfigPatchSchema,
  { ...formConfig, id: ID },
  "Champs non modifiables : id",
  "form config: no id",
);
refuses(
  formConfigPatchSchema,
  { ...formConfig, is_enabled: "on" },
  "Champs invalides : is_enabled",
  "form config: flag as string",
);

console.log("patchSchemas.test.ts: ok");
