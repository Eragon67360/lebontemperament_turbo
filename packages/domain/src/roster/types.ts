// Shared shapes of the member-roster sync (#462). Pure data: the admin's API
// returns them and its review page renders them.

/** The columns the sync knows. `mobilePhone` is read for display only. */
export const ROSTER_FIELDS = [
  "name",
  "email",
  "address",
  "homePhone",
  "mobilePhone",
  "voice",
] as const;
export type RosterField = (typeof ROSTER_FIELDS)[number];

/** Columns the sync cannot work without. */
export const REQUIRED_ROSTER_FIELDS: readonly RosterField[] = ["name", "email"];

/** One roster row after normalisation. `rowId` is positional (`r1` = first row under the header). */
export interface RosterRow {
  rowId: string;
  /** « Prénom NOM », or the cell as written when the rule does not apply. */
  name: string;
  /** Lower-cased, trimmed; "" when the cell is empty. */
  email: string;
  emailValid: boolean;
  address: string;
  /** Display format « 06 12 34 56 78 » when the number has ten digits. */
  homePhone: string;
  mobilePhone: string;
  /** De-duplicated, known casing (« Jeune », « Soprane »). */
  voices: string[];
}

export type RosterIssueCode =
  | "empty"
  | "missing_header"
  | "too_few_rows"
  | "optional_header_missing"
  | "duplicate_email"
  | "invalid_email"
  | "no_name"
  | "no_email"
  | "unknown_voice"
  | "skipped_rows";

export interface RosterIssue {
  code: RosterIssueCode;
  /** French, for the admin. Never contains a full row. */
  message: string;
  rowIds?: string[];
}

export interface RosterValidation {
  errors: RosterIssue[];
  warnings: RosterIssue[];
}

/** A profile as the diff needs it. `status` is the admin's invite status. */
export interface ProfileForDiff {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  address: string | null;
  home_phone: string | null;
  voice: string | null;
  status: "en attente" | "approuvé";
}

/** The fields the roster owns (owner decision, #433). */
export const ROSTER_OWNED_FIELDS = [
  "display_name",
  "address",
  "home_phone",
  "voice",
] as const;
export type RosterOwnedField = (typeof ROSTER_OWNED_FIELDS)[number];

export interface FieldChange {
  field: RosterOwnedField;
  from: string;
  to: string;
}

export interface NewMember {
  rowId: string;
  email: string;
  displayName: string;
  address: string;
  homePhone: string;
  voices: string[];
}

export interface ChangedMember {
  rowId: string;
  profileId: string;
  email: string;
  displayName: string;
  changes: FieldChange[];
}

export interface AbsentMember {
  profileId: string;
  email: string;
  displayName: string;
  role: string;
  status: ProfileForDiff["status"];
}

export interface RowSummary {
  rowId: string;
  name: string;
  email: string;
}

export type ToSettleKind =
  | "duplicate_email"
  | "no_email"
  | "invalid_email"
  | "no_name"
  | "email_changed";

export interface ToSettle {
  kind: ToSettleKind;
  /** French explanation of what to do in the sheet. */
  message: string;
  rows: RowSummary[];
  /** For `email_changed`: the account that may be the same person. */
  profile?: AbsentMember;
}

export interface RosterDiff {
  nouveaux: NewMember[];
  modifies: ChangedMember[];
  absents: AbsentMember[];
  aRegler: ToSettle[];
  unchanged: number;
}

/** What `GET /api/users/sync` answers. */
export interface RosterReview {
  fingerprint: string;
  rowCount: number;
  validation: RosterValidation;
  groups: Omit<RosterDiff, "unchanged">;
  unchanged: number;
}
