import assert from "node:assert/strict";
import { z } from "zod";
import {
  archiveFormSchema,
  audioMemoryFormSchema,
  formConfigFormSchema,
  heroFormSchema,
  heroStatFormSchema,
  navigationCardFormSchema,
  photoFormSchema,
  timelineEventFormSchema,
  videoFormSchema,
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

function assertRequired<T extends Record<string, unknown>>(
  schema: z.ZodType,
  valid: T,
  expectations: Partial<Record<keyof T, string>>,
) {
  assert.equal(schema.safeParse(valid).success, true, "valid input passes");
  for (const [field, message] of Object.entries(expectations)) {
    const { [field]: _omitted, ...without } = valid;
    void _omitted;
    assert.equal(errorsOf(schema, without)[field], message, `${field} missing`);
    if (typeof valid[field] === "string") {
      assert.equal(
        errorsOf(schema, { ...valid, [field]: "" })[field],
        message,
        `${field} empty`,
      );
    }
  }
}

// --- Chiffres clés ---
const stat = {
  icon_name: "FaMusic",
  number: "40",
  label: "ans",
  is_visible: true,
};
assertRequired(heroStatFormSchema, stat, {
  number: "Le chiffre est requis",
  label: "Le libellé est requis",
  icon_name: "Choisissez une icône",
});
assert.equal(
  errorsOf(heroStatFormSchema, { ...stat, icon_name: "FaRocket" }).icon_name,
  "Choisissez une icône",
);
assert.equal(
  errorsOf(heroStatFormSchema, { ...stat, number: "x".repeat(21) }).number,
  "Le chiffre fait 20 caractères au plus",
);

// --- Cartes de navigation: the target is one of the page's sections ---
const card = {
  title: "Notre histoire",
  description: "40 ans de moments",
  icon_name: "FaHistory",
  target_section_id: "timeline",
  is_visible: true,
};
assertRequired(navigationCardFormSchema, card, {
  title: "Le titre est requis",
  description: "La description est requise",
  target_section_id: "Choisissez la section de la page vers laquelle mener",
});
assert.equal(
  errorsOf(navigationCardFormSchema, { ...card, target_section_id: "nope" })
    .target_section_id,
  "Choisissez la section de la page vers laquelle mener",
);

// --- Chronologie: the year comes from a text input and leaves as a number ---
const event = {
  year: "1984",
  title: "La création",
  description: "Un dimanche de novembre",
  icon_name: "FaMusic",
  is_visible: true,
};
assertRequired(timelineEventFormSchema, event, {
  title: "Le titre est requis",
  description: "La description est requise",
});
assert.equal(timelineEventFormSchema.parse(event).year, 1984);
assert.equal(
  timelineEventFormSchema.parse({ ...event, year: 1999 }).year,
  1999,
);
assert.equal(
  errorsOf(timelineEventFormSchema, { ...event, year: "" }).year,
  "L'année est requise",
);
assert.equal(
  errorsOf(timelineEventFormSchema, { ...event, year: "abc" }).year,
  "L'année doit être un nombre, par exemple 1998",
);
assert.equal(
  errorsOf(timelineEventFormSchema, { ...event, year: "1950" }).year,
  "L'année doit être comprise entre 1984 et 2100",
);
assert.equal(
  errorsOf(timelineEventFormSchema, { ...event, year: "1998.5" }).year,
  "L'année doit être un nombre entier",
);

// --- Vidéos: the thumbnail is a field, not a toast; the year is optional ---
const video = {
  thumbnail_url: "Site/anniversary/videos/thumbnails/x",
  title: "Concert 2024",
  description: "Le grand concert",
  video_url: "",
  year: "",
  category: "Concert",
  is_visible: true,
};
assertRequired(videoFormSchema, video, {
  thumbnail_url: "Ajoutez une miniature",
  title: "Le titre est requis",
  description: "La description est requise",
});
assert.equal(videoFormSchema.parse(video).year, null);
assert.equal(videoFormSchema.parse({ ...video, year: "2024" }).year, 2024);
assert.equal(videoFormSchema.parse({ ...video, year: null }).year, null);
assert.equal(
  errorsOf(videoFormSchema, { ...video, year: "20x4" }).year,
  "L'année doit être un nombre, par exemple 1998",
);
assert.equal(
  videoFormSchema.safeParse({ ...video, video_url: "https://youtu.be/abc" })
    .success,
  true,
);
assert.equal(
  errorsOf(videoFormSchema, { ...video, video_url: "youtube" }).video_url,
  "Le lien doit être une adresse complète, par exemple https://youtube.com/…",
);
assert.equal(
  errorsOf(videoFormSchema, { ...video, category: "Clip" }).category,
  "Choisissez une catégorie",
);

// --- Souvenirs audio: duration format ---
const audio = {
  audio_url: "Site/anniversary/audio/x",
  title: "Simone se souvient",
  description: "Novembre 1984",
  speaker_name: "",
  year: "",
  duration: "5:32",
  is_visible: true,
};
assertRequired(audioMemoryFormSchema, audio, {
  audio_url: "Ajoutez un fichier audio",
  title: "Le titre est requis",
  description: "La description est requise",
  duration: "La durée est requise",
});
for (const bad of ["5", "5:7", "5:60", "mm:ss"]) {
  assert.equal(
    errorsOf(audioMemoryFormSchema, { ...audio, duration: bad }).duration,
    "Indiquez la durée en minutes:secondes, par exemple 5:32",
    bad,
  );
}
assert.equal(
  audioMemoryFormSchema.safeParse({ ...audio, duration: "12:05" }).success,
  true,
);

// --- Photos ---
const photo = {
  image_url: "Site/anniversary/photos/x",
  title: "Concert inaugural",
  description: "",
  year: "1984",
  category: "Concert",
  is_visible: false,
};
assertRequired(photoFormSchema, photo, {
  image_url: "Ajoutez une photo",
  title: "Le titre est requis",
});
assert.equal(photoFormSchema.parse(photo).year, 1984);

// --- Archives ---
const archive = {
  title: "Assemblée générale 2023",
  description: "Rapport complet",
  year: "2023",
  type: "assemblée-générale",
  theme: "Gouvernance",
  file_url: "Site/anniversary/archives/x",
  file_size: "1.2 MB",
  is_visible: true,
};
assertRequired(archiveFormSchema, archive, {
  title: "Le titre est requis",
  description: "La description est requise",
  theme: "Choisissez un thème",
  file_url: "Ajoutez un document",
});
assert.equal(
  errorsOf(archiveFormSchema, { ...archive, year: "" }).year,
  "L'année est requise",
);
assert.equal(
  errorsOf(archiveFormSchema, { ...archive, type: "pdf" }).type,
  "Choisissez un type de document",
);

// --- En-tête de la page ---
const hero = {
  hero_number: "40",
  hero_subtitle: "Années de passion",
  description: "",
  cta_text: "Découvrir",
  cta_target_section: "anniversary-navigation",
  enable_intro_animation: true,
  skip_button_text: "Passer l'animation",
};
assertRequired(heroFormSchema, hero, {
  hero_number: "Le chiffre est requis",
  hero_subtitle: "Le sous-titre est requis",
  cta_text: "Le texte du bouton est requis",
  skip_button_text: "Le texte du bouton « Passer l'animation » est requis",
  cta_target_section: "Choisissez la section de la page vers laquelle mener",
});

// --- Formulaire de témoignage ---
const config = {
  section_title: "Partagez vos souvenirs",
  section_description: "Vous avez des souvenirs ?",
  name_label: "Votre nom",
  email_label: "Votre e-mail",
  message_label: "Votre souvenir",
  year_label: "Année",
  submit_button_text: "Partager",
  success_message: "Merci !",
  is_enabled: true,
};
assertRequired(formConfigFormSchema, config, {
  section_title: "Le titre de la section est requis",
  section_description: "La description de la section est requise",
  name_label: "Le libellé du nom est requis",
  submit_button_text: "Le texte du bouton est requis",
  success_message: "Le message de confirmation est requis",
});

console.log("formSchemas.anniversary: ok");
