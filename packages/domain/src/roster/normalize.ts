// Normalisation of the member roster: headers and cell values. Pure.

import type { RosterField } from "./types";
import { REQUIRED_ROSTER_FIELDS, ROSTER_FIELDS } from "./types";

/** Voice values the association uses (owner decision, #433). */
export const DEFAULT_KNOWN_VOICES: readonly string[] = [
  "Soprane",
  "Alto",
  "Ténor",
  "Basse",
  "Jeune",
  "Orchestre",
];

/** The separator stored between several voices; the website and the app split on it. */
export const VOICE_SEPARATOR = " & ";

export const FIELD_LABELS: Record<RosterField, string> = {
  name: "NOM Prénom",
  email: "Adresse mail",
  address: "Adresse postale",
  homePhone: "Domicile",
  mobilePhone: "Portable",
  voice: "Voix",
};

// Written as the sheet might spell them; compared after `normalizeHeader`.
const HEADER_ALIASES: Record<RosterField, string[]> = {
  name: [
    "NOM Prénom",
    "Nom Prénom",
    "Nom et prénom",
    "Prénom NOM",
    "Nom complet",
  ],
  email: [
    "Adresse mail",
    "Adresse e-mail",
    "Adresse email",
    "Mail",
    "E-mail",
    "Email",
    "Courriel",
  ],
  address: ["Adresse postale", "Adresse"],
  homePhone: [
    "Domicile",
    "Téléphone domicile",
    "Tél. domicile",
    "Fixe",
    "Téléphone fixe",
  ],
  mobilePhone: ["Portable", "Mobile", "Téléphone portable", "Tél. portable"],
  voice: ["Voix", "Pupitre"],
};

// A surname column and a first-name column, combined as « Prénom NOM ».
const SURNAME_ALIASES = ["Nom", "Nom de famille", "Nom de naissance"];
const FIRST_NAME_ALIASES = ["Prénom", "Prénoms"];

export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** NFC, trimmed, inner whitespace collapsed. */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

/** Trimmed, BOM-free, accent- and case-insensitive, punctuation ignored. */
export function normalizeHeader(raw: string): string {
  return stripDiacritics(raw.replace(/^﻿/, ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const ALIAS_KEYS: ReadonlyArray<[RosterField, Set<string>]> = ROSTER_FIELDS.map(
  (field) =>
    [
      field,
      new Set(HEADER_ALIASES[field].map((alias) => normalizeHeader(alias))),
    ] as [RosterField, Set<string>],
);

const SURNAME_KEYS = new Set(SURNAME_ALIASES.map(normalizeHeader));
const FIRST_NAME_KEYS = new Set(FIRST_NAME_ALIASES.map(normalizeHeader));

export interface HeaderMapping {
  /** Raw header of the sheet for each recognised field. */
  columns: Partial<Record<RosterField, string>>;
  /** Required fields with no column. */
  missing: RosterField[];
  /** Optional fields with no column. */
  absent: RosterField[];
  /** Set when the name comes from two columns instead of « NOM Prénom ». */
  nameParts?: { surname: string; firstName: string };
  /** A « Nom » column without « Prénom » and without « NOM Prénom ». */
  surnameOnly: boolean;
}

/** Matches the sheet's headers to the known fields; the first match wins. */
export function mapHeaders(rawHeaders: readonly string[]): HeaderMapping {
  const columns: Partial<Record<RosterField, string>> = {};
  let surname: string | undefined;
  let firstName: string | undefined;
  for (const raw of rawHeaders) {
    const key = normalizeHeader(raw);
    if (!key) continue;
    const match = ALIAS_KEYS.find(
      ([field, aliases]) => columns[field] === undefined && aliases.has(key),
    );
    if (match) columns[match[0]] = raw;
    else if (surname === undefined && SURNAME_KEYS.has(key)) surname = raw;
    else if (firstName === undefined && FIRST_NAME_KEYS.has(key)) {
      firstName = raw;
    }
  }
  const nameParts =
    columns.name === undefined &&
    surname !== undefined &&
    firstName !== undefined
      ? { surname, firstName }
      : undefined;
  const hasName = columns.name !== undefined || nameParts !== undefined;
  const missing = REQUIRED_ROSTER_FIELDS.filter((f) =>
    f === "name" ? !hasName : columns[f] === undefined,
  );
  const absent = ROSTER_FIELDS.filter(
    (f) => !REQUIRED_ROSTER_FIELDS.includes(f) && columns[f] === undefined,
  );
  return {
    columns,
    missing,
    absent,
    nameParts,
    surnameOnly: !hasName && surname !== undefined,
  };
}

/**
 * Index of the header row in a sheet's values grid: the first row whose cells
 * name every required column (it is not always the first row: a sheet sorted
 * A→Z with its header row selected moves the header among the members).
 * -1 when no row does.
 */
export function findHeaderRowIndex(
  grid: ReadonlyArray<ReadonlyArray<string>>,
): number {
  return grid.findIndex((row) => mapHeaders(row).missing.length === 0);
}

export function normalizeEmail(value: string | null | undefined): string {
  return normalizeText(value).toLowerCase();
}

// Deliberately loose: one `@`, something on both sides, a dot in the domain.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

// Several numbers in one cell: « 06… / 06… », « , », « ; », « ou ».
const PHONE_LIST_SPLIT = /\s*(?:[,;/]|\bou\b)\s*/i;
// +33 or 0033, optionally followed by the « (0) » people write after it.
const FRENCH_PREFIX = /^(?:\+33|0033)\s*(?:\(0\)\s*)?/;

function phoneParts(text: string): string[] {
  return text.split(PHONE_LIST_SPLIT).map(normalizeText).filter(Boolean);
}

function singlePhoneKey(text: string): string {
  if (FRENCH_PREFIX.test(text)) {
    return `0${text.replace(FRENCH_PREFIX, "").replace(/\D/g, "")}`;
  }
  if (text.startsWith("+")) return `+${text.replace(/\D/g, "")}`;
  return text.replace(/\D/g, "");
}

/**
 * Comparison key. A French number becomes its ten digits (+33, 0033 and a
 * « (0) » after them folded to the leading 0); a foreign number keeps its
 * « + »; a cell holding several numbers is compared as written (single
 * spaces), never as concatenated digits.
 */
export function phoneKey(value: string | null | undefined): string {
  const text = normalizeText(value);
  if (!text) return "";
  if (phoneParts(text).length > 1) return text;
  return singlePhoneKey(text);
}

/**
 * Display format: « 06 12 34 56 78 » for a ten-digit French number. Anything
 * else (a foreign number with its « + », several numbers, an odd length, no
 * digit) is shown as written, trimmed to single spaces.
 */
export function normalizePhone(value: string | null | undefined): string {
  const text = normalizeText(value);
  if (!text) return "";
  if (phoneParts(text).length > 1) return text;
  const key = singlePhoneKey(text);
  if (/^0\d{9}$/.test(key)) return key.replace(/(\d{2})(?=\d)/g, "$1 ");
  return text;
}

const LETTER = /\p{L}/u;

function isUpperToken(token: string): boolean {
  return LETTER.test(token) && token === token.toLocaleUpperCase("fr");
}

/**
 * « NOM Prénom » → « Prénom NOM ». The surname is the leading run of
 * upper-case tokens (« DE LA FONTAINE Jean » → « Jean DE LA FONTAINE »).
 * Without such a run, or when every token is upper case, the name is kept as
 * written: the rule never splits on word count.
 */
export function normalizeName(value: string | null | undefined): string {
  const text = normalizeText(value);
  if (!text) return "";
  const tokens = text.split(" ");
  let run = 0;
  for (const token of tokens) {
    if (!isUpperToken(token)) break;
    run++;
  }
  if (run === 0 || run === tokens.length) return text;
  return [...tokens.slice(run), ...tokens.slice(0, run)].join(" ");
}

/** Order-, case- and accent-insensitive key for « same person? » matching. */
export function nameKey(value: string | null | undefined): string {
  return stripDiacritics(normalizeText(value))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function voiceKey(value: string): string {
  return stripDiacritics(normalizeText(value)).toLowerCase();
}

const VOICE_SPLIT = /\s*(?:[,/+&;]|\bet\b)\s*/i;

/**
 * « Jeune, Soprane », « Jeune / Soprane », « Jeune + Soprane », « Jeune et
 * Soprane » → ["Jeune", "Soprane"]: de-duplicated, with the known value's
 * casing; an unknown value is kept as written.
 */
export function splitVoices(
  value: string | null | undefined,
  known: readonly string[] = DEFAULT_KNOWN_VOICES,
): string[] {
  const text = normalizeText(value);
  if (!text) return [];
  const seen = new Set<string>();
  const voices: string[] = [];
  for (const part of text.split(VOICE_SPLIT)) {
    const cleaned = normalizeText(part);
    if (!cleaned) continue;
    const key = voiceKey(cleaned);
    if (seen.has(key)) continue;
    seen.add(key);
    voices.push(known.find((k) => voiceKey(k) === key) ?? cleaned);
  }
  return voices;
}

export function joinVoices(voices: readonly string[]): string {
  return voices.join(VOICE_SEPARATOR);
}

export function isKnownVoice(
  voice: string,
  known: readonly string[] = DEFAULT_KNOWN_VOICES,
): boolean {
  const key = voiceKey(voice);
  return known.some((k) => voiceKey(k) === key);
}
