// « Rejoindre et FAQ »: the dialogs' fields and what they send.
import type { RowField, RowValues } from "@/components/joining/RowDialog";
import type {
  FaqInput,
  FaqItem,
  JoiningSlot,
  SlotInput,
} from "@/hooks/useJoiningContent";
import {
  FAQ_ANSWER_MAX,
  FAQ_LINK_LABEL_MAX,
  FAQ_LINK_MAX,
  FAQ_QUESTION_MAX,
  SITE_LINK_PATTERN,
  SLOT_DAY_MAX,
  SLOT_GROUP_MAX,
  SLOT_PLACE_MAX,
  SLOT_RHYTHM_MAX,
  SLOT_TIME_MAX,
} from "@repo/domain/utils/joiningContent";

export type SlotKey = "group_name" | "day" | "time_label" | "place" | "rhythm";
export type FaqKey = "question" | "answer" | "link_href" | "link_label";

export const SLOT_FIELDS: RowField<SlotKey>[] = [
  {
    key: "group_name",
    label: "Qui",
    max: SLOT_GROUP_MAX,
    required: true,
    placeholder: "Pupitres de femmes",
  },
  {
    key: "day",
    label: "Jour",
    max: SLOT_DAY_MAX,
    required: true,
    placeholder: "mercredi",
  },
  {
    key: "time_label",
    label: "Horaire",
    max: SLOT_TIME_MAX,
    required: true,
    placeholder: "20 h 30 – 22 h",
  },
  {
    key: "place",
    label: "Lieu",
    max: SLOT_PLACE_MAX,
    required: true,
    placeholder: "à Nordheim",
    help: "Avec « à » ou « au » : la phrase se lit « Le mercredi, 20 h 30 – 22 h, à Nordheim ».",
  },
  {
    key: "rhythm",
    label: "Rythme",
    max: SLOT_RHYTHM_MAX,
    required: true,
    placeholder: "toutes les deux semaines",
  },
];

export const FAQ_FIELDS: RowField<FaqKey>[] = [
  {
    key: "question",
    label: "Question",
    max: FAQ_QUESTION_MAX,
    required: true,
  },
  {
    key: "answer",
    label: "Réponse",
    max: FAQ_ANSWER_MAX,
    required: true,
    multiline: true,
    help: "Texte simple : Google peut l'afficher tel quel dans ses résultats.",
  },
  {
    key: "link_href",
    label: "Lien sous la réponse",
    max: FAQ_LINK_MAX,
    placeholder: "/rejoindre ou https://…",
  },
  {
    key: "link_label",
    label: "Texte du lien",
    max: FAQ_LINK_LABEL_MAX,
    placeholder: "Découvrir la page Rejoindre",
  },
];

/** The sentence /rejoindre shows for a rehearsal time. */
export function slotSentence(slot: SlotInput): string {
  return `Le ${slot.day}, ${slot.time_label}, ${slot.place} (${slot.rhythm}).`;
}

export function slotValues(slot?: JoiningSlot | null): RowValues<SlotKey> {
  return {
    group_name: slot?.group_name ?? "",
    day: slot?.day ?? "",
    time_label: slot?.time_label ?? "",
    place: slot?.place ?? "",
    rhythm: slot?.rhythm ?? "",
  };
}

export function faqValues(item?: FaqItem | null): RowValues<FaqKey> {
  return {
    question: item?.question ?? "",
    answer: item?.answer ?? "",
    link_href: item?.link_href ?? "",
    link_label: item?.link_label ?? "",
  };
}

/** The link must lead somewhere valid and comes with its text. */
export function validateFaq(
  values: RowValues<FaqKey>,
): Partial<Record<FaqKey, string>> {
  const errors: Partial<Record<FaqKey, string>> = {};
  if (values.link_href && !SITE_LINK_PATTERN.test(values.link_href))
    errors.link_href =
      "Une page du site (/rejoindre) ou une adresse commençant par https://.";
  if (values.link_href && !values.link_label)
    errors.link_label = "Donnez un texte au lien.";
  if (!values.link_href && values.link_label)
    errors.link_href = "Indiquez où mène le lien, ou videz son texte.";
  return errors;
}

export function faqInput(values: RowValues<FaqKey>): FaqInput {
  return {
    question: values.question,
    answer: values.answer,
    link_href: values.link_href || null,
    link_label: values.link_href ? values.link_label || null : null,
  };
}
