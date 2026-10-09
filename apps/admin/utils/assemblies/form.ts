// The « Assemblée générale » dialog's form: what it opens with (an AG being
// edited, or the previous one copied for next year) and what it sends.
import type { AssemblyInput, GeneralAssembly } from "@/hooks/useAssemblies";
import {
  ASSEMBLY_NOTE_MAX,
  ASSEMBLY_PLACE_MAX,
  ASSEMBLY_TEXT_MAX,
  isoToParisLocal,
  parisLocalToIso,
} from "@repo/domain/utils/generalAssemblies";

export type AssemblyForm = {
  /** Paris wall clock, `YYYY-MM-DDTHH:mm` (`<input type="datetime-local">`). */
  heldAt: string;
  place: string;
  practicalNote: string;
  reminders: string;
  votingRights: string;
  agenda: string;
  afterwards: string;
  /** "" for none. */
  convocationId: string;
  proxyId: string;
  published: boolean;
};

export type AssemblyFormField = keyof AssemblyForm;

export const MARKDOWN_FIELDS = [
  { key: "reminders", label: "Rappels importants" },
  { key: "votingRights", label: "Droit de vote" },
  { key: "agenda", label: "Ordre du jour" },
  { key: "afterwards", label: "Après l'AG" },
] as const satisfies readonly { key: AssemblyFormField; label: string }[];

const EMPTY: AssemblyForm = {
  heldAt: "",
  place: "",
  practicalNote: "",
  reminders: "",
  votingRights: "",
  agenda: "",
  afterwards: "",
  convocationId: "",
  proxyId: "",
  published: false,
};

/** The form for an AG being edited. */
export function formFromAssembly(assembly: GeneralAssembly): AssemblyForm {
  return {
    heldAt: isoToParisLocal(assembly.held_at),
    place: assembly.place,
    practicalNote: assembly.practical_note ?? "",
    reminders: assembly.reminders ?? "",
    votingRights: assembly.voting_rights ?? "",
    agenda: assembly.agenda ?? "",
    afterwards: assembly.afterwards ?? "",
    convocationId: assembly.convocation_document_id ?? "",
    proxyId: assembly.proxy_document_id ?? "",
    published: assembly.status === "published",
  };
}

/**
 * A new AG: the previous one's place and texts, to reread and adjust; no
 * date, no documents (this year's PDFs are new ones), not published yet.
 */
export function formForNext(previous?: GeneralAssembly | null): AssemblyForm {
  if (!previous) return { ...EMPTY };
  return {
    ...formFromAssembly(previous),
    heldAt: "",
    convocationId: "",
    proxyId: "",
    published: false,
  };
}

export function isSameForm(a: AssemblyForm, b: AssemblyForm): boolean {
  return (Object.keys(a) as AssemblyFormField[]).every((k) => a[k] === b[k]);
}

export type FormCheck =
  | { ok: true; value: AssemblyInput }
  | { ok: false; errors: Partial<Record<AssemblyFormField, string>> };

const orNull = (text: string) => (text.trim() ? text.trim() : null);

/** Checks the form like the API does and builds the request body. */
export function inputFromForm(form: AssemblyForm): FormCheck {
  const errors: Partial<Record<AssemblyFormField, string>> = {};
  const heldAt = form.heldAt ? parisLocalToIso(form.heldAt) : null;
  if (!heldAt) errors.heldAt = "Indiquez le jour et l'heure de l'AG.";
  if (!form.place.trim()) errors.place = "Indiquez le lieu.";
  else if (form.place.trim().length > ASSEMBLY_PLACE_MAX)
    errors.place = `${ASSEMBLY_PLACE_MAX} caractères au plus.`;
  if (form.practicalNote.trim().length > ASSEMBLY_NOTE_MAX)
    errors.practicalNote = `${ASSEMBLY_NOTE_MAX} caractères au plus.`;
  for (const { key } of MARKDOWN_FIELDS) {
    if (form[key].trim().length > ASSEMBLY_TEXT_MAX)
      errors[key] = `${ASSEMBLY_TEXT_MAX} caractères au plus.`;
  }
  if (!heldAt || Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      held_at: heldAt,
      place: form.place.trim(),
      practical_note: orNull(form.practicalNote),
      reminders: orNull(form.reminders),
      voting_rights: orNull(form.votingRights),
      agenda: orNull(form.agenda),
      afterwards: orNull(form.afterwards),
      convocation_document_id: form.convocationId || null,
      proxy_document_id: form.proxyId || null,
      status: form.published ? "published" : "draft",
    },
  };
}
