// Roster rows against the admin's profiles: who is new, what changed, who is
// no longer listed, what needs sorting out in the sheet. Pure.

import {
  joinVoices,
  nameKey,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  phoneKey,
  splitVoices,
  voiceKey,
} from "./normalize";
import type {
  AbsentMember,
  FieldChange,
  ProfileForDiff,
  RosterDiff,
  RosterRow,
  RowSummary,
  ToSettle,
} from "./types";

const summary = (row: RosterRow): RowSummary => ({
  rowId: row.rowId,
  name: row.name,
  email: row.email,
});

const absentOf = (profile: ProfileForDiff): AbsentMember => ({
  profileId: profile.id,
  email: normalizeEmail(profile.email),
  displayName: normalizeText(profile.display_name),
  role: profile.role ?? "user",
  status: profile.status,
});

const byName = (a: { displayName: string }, b: { displayName: string }) =>
  a.displayName.localeCompare(b.displayName, "fr");

/**
 * Field-by-field changes on the roster-owned fields. An empty roster cell
 * never proposes clearing a value, and a difference that disappears after
 * normalisation (phone formatting, voice order, spacing) is not a change.
 */
export function fieldChanges(
  row: RosterRow,
  profile: ProfileForDiff,
  knownVoices?: readonly string[],
): FieldChange[] {
  const changes: FieldChange[] = [];

  const currentName = normalizeText(profile.display_name);
  if (row.name && currentName !== row.name) {
    changes.push({ field: "display_name", from: currentName, to: row.name });
  }

  const currentAddress = normalizeText(profile.address);
  if (row.address && currentAddress !== row.address) {
    changes.push({ field: "address", from: currentAddress, to: row.address });
  }

  const currentPhone = normalizeText(profile.home_phone);
  if (row.homePhone && phoneKey(currentPhone) !== phoneKey(row.homePhone)) {
    changes.push({
      field: "home_phone",
      from: normalizePhone(currentPhone),
      to: row.homePhone,
    });
  }

  if (row.voices.length > 0) {
    const currentVoices = splitVoices(profile.voice, knownVoices);
    const currentKeys = new Set(currentVoices.map(voiceKey));
    const sameSet =
      currentKeys.size === row.voices.length &&
      row.voices.every((v) => currentKeys.has(voiceKey(v)));
    if (!sameSet) {
      changes.push({
        field: "voice",
        from: normalizeText(profile.voice),
        to: joinVoices(row.voices),
      });
    }
  }

  return changes;
}

/**
 * Rows are matched to profiles by normalised email. Rows sharing an email,
 * without one, or with a malformed one go to « à régler ». An unmatched row
 * whose name matches exactly one unmatched profile is proposed as « peut-être
 * la même personne » instead of a new account. Every unmatched profile, of
 * every status, is « absent de la liste ».
 */
export function diffRoster(
  rows: readonly RosterRow[],
  profiles: readonly ProfileForDiff[],
  knownVoices?: readonly string[],
): RosterDiff {
  const nouveaux: RosterDiff["nouveaux"] = [];
  const modifies: RosterDiff["modifies"] = [];
  const aRegler: ToSettle[] = [];
  let unchanged = 0;

  const profileByEmail = new Map<string, ProfileForDiff>();
  for (const profile of profiles) {
    const email = normalizeEmail(profile.email);
    if (email && !profileByEmail.has(email)) profileByEmail.set(email, profile);
  }
  const seenProfiles = new Set<string>();

  const rowsByEmail = new Map<string, RosterRow[]>();
  const noEmail: RosterRow[] = [];
  const invalidEmail: RosterRow[] = [];
  for (const row of rows) {
    if (!row.email) noEmail.push(row);
    else if (!row.emailValid) invalidEmail.push(row);
    else {
      const list = rowsByEmail.get(row.email) ?? [];
      list.push(row);
      rowsByEmail.set(row.email, list);
    }
  }

  const candidates: RosterRow[] = [];
  for (const [email, group] of rowsByEmail) {
    const profile = profileByEmail.get(email);
    if (profile) seenProfiles.add(profile.id);
    if (group.length > 1) {
      aRegler.push({
        kind: "duplicate_email",
        message: `${group.length} lignes partagent l'email « ${email} ». Donnez à chaque membre sa propre adresse ; en attendant, ${
          profile
            ? "le compte existant n'est pas modifié"
            : "aucun compte n'est créé"
        }.`,
        rows: group.map(summary),
      });
      continue;
    }
    const row = group[0] as RosterRow;
    if (!profile) {
      candidates.push(row);
      continue;
    }
    const changes = fieldChanges(row, profile, knownVoices);
    if (changes.length === 0) {
      unchanged++;
    } else {
      modifies.push({
        rowId: row.rowId,
        profileId: profile.id,
        email,
        displayName: row.name || normalizeText(profile.display_name),
        changes,
      });
    }
  }

  // Name-only matches among the profiles no row claimed by email.
  const unmatchedByName = new Map<string, ProfileForDiff[]>();
  for (const profile of profiles) {
    if (seenProfiles.has(profile.id)) continue;
    const key = nameKey(profile.display_name);
    if (!key) continue;
    const list = unmatchedByName.get(key) ?? [];
    list.push(profile);
    unmatchedByName.set(key, list);
  }

  for (const row of candidates) {
    if (!row.name) {
      aRegler.push({
        kind: "no_name",
        message: `La ligne avec l'email « ${row.email} » n'a pas de nom : ajoutez-le pour pouvoir inviter cette personne.`,
        rows: [summary(row)],
      });
      continue;
    }
    const sameName = unmatchedByName.get(nameKey(row.name)) ?? [];
    if (sameName.length === 1) {
      const profile = sameName[0] as ProfileForDiff;
      seenProfiles.add(profile.id);
      unmatchedByName.delete(nameKey(row.name));
      aRegler.push({
        kind: "email_changed",
        message: `Peut-être la même personne : le compte « ${normalizeEmail(profile.email)} » porte le même nom. Si c'est le cas, l'email du compte doit être changé plutôt qu'un second compte créé.`,
        rows: [summary(row)],
        profile: absentOf(profile),
      });
      continue;
    }
    nouveaux.push({
      rowId: row.rowId,
      email: row.email,
      displayName: row.name,
      address: row.address,
      homePhone: row.homePhone,
      voices: row.voices,
    });
  }

  if (noEmail.length > 0) {
    aRegler.push({
      kind: "no_email",
      message: `${noEmail.length > 1 ? `${noEmail.length} lignes n'ont` : "1 ligne n'a"} pas d'email : pas de compte tant que la personne n'a pas sa propre adresse.`,
      rows: noEmail.map(summary),
    });
  }
  if (invalidEmail.length > 0) {
    aRegler.push({
      kind: "invalid_email",
      message: `${invalidEmail.length > 1 ? `${invalidEmail.length} lignes ont` : "1 ligne a"} un email mal formé : corrigez-le dans le tableau.`,
      rows: invalidEmail.map(summary),
    });
  }

  const absents = profiles
    .filter((profile) => !seenProfiles.has(profile.id))
    .map(absentOf)
    .sort(byName);

  nouveaux.sort(byName);
  modifies.sort(byName);

  return { nouveaux, modifies, absents, aRegler, unchanged };
}
