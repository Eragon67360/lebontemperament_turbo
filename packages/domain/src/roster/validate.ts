// Validation and normalisation of the member roster. Pure: rows in, rows and
// issues out. Errors block the sync; warnings are shown with the review.

import {
  DEFAULT_KNOWN_VOICES,
  FIELD_LABELS,
  isKnownVoice,
  isValidEmail,
  mapHeaders,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeText,
  splitVoices,
} from "./normalize";
import type {
  RosterField,
  RosterIssue,
  RosterRow,
  RosterValidation,
} from "./types";

export interface ParseRosterOptions {
  /** Profiles the admin currently has; the floor is half of it. */
  activeProfilesCount: number;
  knownVoices?: readonly string[];
  /**
   * Member rows the source found above the header row (a sheet sorted with
   * its header): read as members, and the admin is told to fix the sheet.
   */
  rowsAboveHeader?: number;
}

export interface ParsedRoster extends RosterValidation {
  rows: RosterRow[];
  /** Raw sheet header for each recognised field. */
  columns: Partial<Record<RosterField, string>>;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

const quote = (value: string) => `« ${value} »`;

/**
 * Parses the roster rows (objects keyed by the sheet's header row, as
 * `fetchRosterRows()` gives them). A row with neither a name nor an email is
 * skipped and counted. Required headers missing or a collapsed row count are
 * errors; everything else is a warning.
 */
export function parseRoster(
  rawRows: ReadonlyArray<Record<string, string>>,
  options: ParseRosterOptions,
): ParsedRoster {
  const known = options.knownVoices ?? DEFAULT_KNOWN_VOICES;
  const errors: RosterIssue[] = [];
  const warnings: RosterIssue[] = [];

  if (rawRows.length === 0) {
    errors.push({
      code: "empty",
      message:
        "Le tableau des membres est vide : aucune ligne n'a été lue sous l'en-tête.",
    });
    return { rows: [], errors, warnings, columns: {} };
  }

  const rawHeaders = Array.from(
    new Set(rawRows.flatMap((row) => Object.keys(row))),
  );
  const { columns, missing, absent, nameParts, surnameOnly } =
    mapHeaders(rawHeaders);

  // The "headers" are a member's cells: the sheet has no header row at all.
  // Listing them would only echo that member's details back.
  if (
    missing.length > 0 &&
    rawHeaders.some((header) => isValidEmail(normalizeEmail(header)))
  ) {
    errors.push({
      code: "no_header_row",
      message:
        "Ligne d'en-tête introuvable : aucune ligne du tableau ne porte les titres « NOM Prénom » et « Adresse mail », et la première ligne lue est celle d'un membre. Remettez la ligne des titres en haut du tableau, puis relisez-le.",
    });
    return { rows: [], errors, warnings, columns };
  }

  for (const field of missing) {
    if (field === "name" && surnameOnly) {
      errors.push({
        code: "missing_header",
        message:
          "Colonne « Prénom » introuvable : le tableau a une colonne « Nom » seule. Attendu : une colonne « NOM Prénom » (nom et prénom dans la même cellule), ou deux colonnes « Nom » et « Prénom ». Renommez l'en-tête dans le tableau, puis relisez-le.",
      });
      continue;
    }
    errors.push({
      code: "missing_header",
      message: `Colonne ${quote(FIELD_LABELS[field])} introuvable. Colonnes lues : ${
        rawHeaders.filter(Boolean).map(quote).join(", ") || "aucune"
      }. Renommez l'en-tête dans le tableau, puis relisez-le.`,
    });
  }
  if (missing.length > 0) {
    return { rows: [], errors, warnings, columns };
  }

  const above = options.rowsAboveHeader ?? 0;
  if (above > 0) {
    warnings.push({
      code: "header_not_first",
      message: `La ligne d'en-tête n'est plus la première ligne du tableau : il a sans doute été trié avec elle. ${plural(above, "ligne de membre placée au-dessus a", "lignes de membres placées au-dessus ont")} quand même été ${above > 1 ? "lues" : "lue"}. Remettez l'en-tête en première ligne dans le tableau.`,
    });
  }

  for (const field of absent) {
    warnings.push({
      code: "optional_header_missing",
      message: `Colonne ${quote(FIELD_LABELS[field])} absente : ce champ ne sera pas comparé.`,
    });
  }

  const cell = (row: Record<string, string>, field: RosterField): string => {
    const header = columns[field];
    return header === undefined ? "" : normalizeText(row[header]);
  };

  // « NOM Prénom » in one cell, or « Nom » + « Prénom » combined as « Prénom NOM ».
  const nameOf = (raw: Record<string, string>): string => {
    if (nameParts) {
      const first = normalizeText(raw[nameParts.firstName]);
      const last = normalizeText(raw[nameParts.surname]).toLocaleUpperCase(
        "fr",
      );
      return [first, last].filter(Boolean).join(" ");
    }
    return normalizeName(cell(raw, "name"));
  };

  const rows: RosterRow[] = [];
  let skipped = 0;
  rawRows.forEach((raw, index) => {
    const name = nameOf(raw);
    const email = normalizeEmail(cell(raw, "email"));
    if (!name && !email) {
      skipped++;
      return;
    }
    rows.push({
      rowId: `r${index + 1}`,
      name,
      email,
      emailValid: email !== "" && isValidEmail(email),
      address: cell(raw, "address"),
      homePhone: normalizePhone(cell(raw, "homePhone")),
      mobilePhone: normalizePhone(cell(raw, "mobilePhone")),
      voices: splitVoices(cell(raw, "voice"), known),
    });
  });

  if (skipped > 0) {
    warnings.push({
      code: "skipped_rows",
      message: `${plural(skipped, "ligne", "lignes")} sans nom ni email ${
        skipped > 1 ? "ont été ignorées" : "a été ignorée"
      }.`,
    });
  }

  if (rows.length === 0) {
    errors.push({
      code: "empty",
      message:
        "Le tableau des membres ne contient aucune ligne avec un nom ou un email.",
    });
    return { rows: [], errors, warnings, columns };
  }

  if (
    options.activeProfilesCount > 0 &&
    rows.length * 2 < options.activeProfilesCount
  ) {
    errors.push({
      code: "too_few_rows",
      message: `Le tableau ne contient que ${plural(rows.length, "ligne", "lignes")} pour ${plural(
        options.activeProfilesCount,
        "compte existant",
        "comptes existants",
      )} : la lecture semble incomplète (mauvais onglet, plage ou fichier tronqué). Rien n'a été comparé.`,
    });
    return { rows, errors, warnings, columns };
  }

  const byEmail = new Map<string, string[]>();
  const invalid: string[] = [];
  const noName: string[] = [];
  const noEmail: string[] = [];
  const unknownVoices = new Map<string, string[]>();

  for (const row of rows) {
    if (row.email) {
      if (row.emailValid) {
        const ids = byEmail.get(row.email) ?? [];
        ids.push(row.rowId);
        byEmail.set(row.email, ids);
      } else {
        invalid.push(row.rowId);
      }
      if (!row.name) noName.push(row.rowId);
    } else {
      noEmail.push(row.rowId);
    }
    for (const voice of row.voices) {
      if (isKnownVoice(voice, known)) continue;
      const ids = unknownVoices.get(voice) ?? [];
      ids.push(row.rowId);
      unknownVoices.set(voice, ids);
    }
  }

  for (const [email, rowIds] of byEmail) {
    if (rowIds.length < 2) continue;
    warnings.push({
      code: "duplicate_email",
      message: `L'email ${quote(email)} apparaît sur ${plural(rowIds.length, "ligne", "lignes")}. Chaque membre a besoin de sa propre adresse pour avoir un compte.`,
      rowIds,
    });
  }
  if (invalid.length > 0) {
    warnings.push({
      code: "invalid_email",
      message: `${plural(invalid.length, "ligne a", "lignes ont")} un email mal formé.`,
      rowIds: invalid,
    });
  }
  if (noName.length > 0) {
    warnings.push({
      code: "no_name",
      message: `${plural(noName.length, "ligne a", "lignes ont")} un email mais pas de nom.`,
      rowIds: noName,
    });
  }
  if (noEmail.length > 0) {
    warnings.push({
      code: "no_email",
      message: `${plural(noEmail.length, "ligne a", "lignes ont")} un nom mais pas d'email : pas de compte possible.`,
      rowIds: noEmail,
    });
  }
  for (const [voice, rowIds] of unknownVoices) {
    warnings.push({
      code: "unknown_voice",
      message: `Voix inconnue ${quote(voice)} (${plural(rowIds.length, "ligne", "lignes")}). Valeurs attendues : ${known.join(", ")}.`,
      rowIds,
    });
  }

  return { rows, errors, warnings, columns };
}
