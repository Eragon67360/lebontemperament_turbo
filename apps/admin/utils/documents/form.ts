// The date fields of « Ajouter un document » / « Modifier le document »:
// how a stored date shows in the form, what the form stores, and the guess
// made from a dropped file's name. Pure, tested in form.test.ts.

export type FormPrecision = "day" | "month" | "year" | "none";

export type FormDate = { precision: FormPrecision; value: string };

export type StoredDate = {
  document_date: string | null;
  date_precision: "day" | "month" | "year" | null;
};

export const PRECISION_LABELS: Record<FormPrecision, string> = {
  day: "Un jour précis",
  month: "Un mois",
  year: "Une année",
  none: "Sans date",
};

/** The form's value for a stored date: 2025-06-21, 2024-08, 2024 or "". */
export function toFormDate(
  date: string | null | undefined,
  precision: string | null | undefined,
): FormDate {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { precision: "none", value: "" };
  }
  if (precision === "year") return { precision, value: date.slice(0, 4) };
  if (precision === "month") return { precision, value: date.slice(0, 7) };
  return { precision: "day", value: date };
}

/** What to store, or an error message for the date field. */
export function fromFormDate(
  form: FormDate,
): { ok: true; value: StoredDate } | { ok: false; error: string } {
  const { precision, value } = form;
  if (precision === "none") {
    return { ok: true, value: { document_date: null, date_precision: null } };
  }
  const v = value.trim();
  if (precision === "year") {
    const year = Number(v);
    if (!/^\d{4}$/.test(v) || year < 1900 || year > 2100) {
      return { ok: false, error: "Indiquez une année, par exemple 2025." };
    }
    return {
      ok: true,
      value: { document_date: `${v}-01-01`, date_precision: "year" },
    };
  }
  if (precision === "month") {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) {
      return { ok: false, error: "Choisissez un mois." };
    }
    return {
      ok: true,
      value: { document_date: `${v}-01`, date_precision: "month" },
    };
  }
  const parsed = new Date(`${v}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== v
  ) {
    return { ok: false, error: "Choisissez une date." };
  }
  return { ok: true, value: { document_date: v, date_precision: "day" } };
}

/**
 * A first title and date from a file name: « gazette_2025_06_21.pdf » →
 * « gazette 2025 06 21 », 2025-06-21; « CR AG 2024.pdf » → year 2024.
 * The admin corrects them before saving.
 */
export function guessFromFileName(name: string): {
  title: string;
  date: FormDate;
} {
  const base = name.replace(/\.pdf$/i, "");
  const title = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const day = /(\d{4})[ _.-](\d{2})[ _.-](\d{2})/.exec(base);
  if (day) {
    const value = `${day[1]}-${day[2]}-${day[3]}`;
    if (fromFormDate({ precision: "day", value }).ok) {
      return { title, date: { precision: "day", value } };
    }
  }
  const year = /(?:^|\D)(19\d{2}|20\d{2})(?:\D|$)/.exec(base);
  if (year) return { title, date: { precision: "year", value: year[1]! } };
  return { title, date: { precision: "none", value: "" } };
}
