// The concert story form (Phase 4 wave 3, #480): its fields, the tab each
// one sits on, and the wording of the upload progress. Pure, unit-tested;
// `components/projects/ProjectDialog.tsx` renders it.

export type StoryTabId = "general" | "content" | "media";

/** Field labels and ids (the error summary's order), and the tab each sits on. */
export const STORY_FIELD_LABELS = {
  name: { label: "Nom", id: "story-name" },
  sub_name: { label: "Sous-titre", id: "story-sub-name" },
  slug: { label: "Adresse de la page", id: "story-slug" },
  date: { label: "Date du concert", id: "story-date" },
  author_name: { label: "Auteur de la fiche", id: "story-author" },
  explanation: { label: "Introduction", id: "story-explanation" },
  text1: { label: "Premier texte", id: "story-text1" },
  text2: { label: "Second texte", id: "story-text2" },
  banniere_photographer_name: {
    label: "Photographe de la bannière",
    id: "story-banniere-photographer",
  },
  banniere_photographer_url: {
    label: "Site du photographe de la bannière",
    id: "story-banniere-photographer-url",
  },
  image2_photographer_name: {
    label: "Photographe de la deuxième image",
    id: "story-image2-photographer",
  },
  image2_photographer_url: {
    label: "Site du photographe de la deuxième image",
    id: "story-image2-photographer-url",
  },
  image3_photographer_name: {
    label: "Photographe de la troisième image",
    id: "story-image3-photographer",
  },
  image3_photographer_url: {
    label: "Site du photographe de la troisième image",
    id: "story-image3-photographer-url",
  },
} as const;

export type StoryFieldName = keyof typeof STORY_FIELD_LABELS;

export const STORY_TAB_OF: Record<StoryFieldName, StoryTabId> = {
  name: "general",
  sub_name: "general",
  slug: "general",
  date: "general",
  author_name: "general",
  explanation: "content",
  text1: "content",
  text2: "content",
  banniere_photographer_name: "media",
  banniere_photographer_url: "media",
  image2_photographer_name: "media",
  image2_photographer_url: "media",
  image3_photographer_name: "media",
  image3_photographer_url: "media",
};

/** The tab a field id belongs to (for the error summary's links). */
export function tabOfFieldId(fieldId: string): StoryTabId | undefined {
  const entry = (Object.keys(STORY_FIELD_LABELS) as StoryFieldName[]).find(
    (name) => STORY_FIELD_LABELS[name].id === fieldId,
  );
  return entry ? STORY_TAB_OF[entry] : undefined;
}

/** The tab holding the first field in error, in the form's order. */
export function firstTabWithError(
  errors: Partial<Record<StoryFieldName, unknown>>,
): StoryTabId | undefined {
  const first = (Object.keys(STORY_FIELD_LABELS) as StoryFieldName[]).find(
    (name) => errors[name],
  );
  return first ? STORY_TAB_OF[first] : undefined;
}

/** « Envoi de l'image 2 sur 4… » while the chosen files go up. */
export function uploadProgressLabel(index: number, total: number): string {
  return total > 1
    ? `Envoi de l'image ${index} sur ${total}…`
    : "Envoi de l'image…";
}
