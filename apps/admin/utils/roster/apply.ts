// utils/roster/apply.ts
//
// The apply step of the roster sync, with its dependencies injected so the
// route stays thin and this logic is unit-tested. The client only names what
// to apply (row ids, profile ids and field names): every value written comes
// from the server's own re-read of the roster, refused when its fingerprint
// no longer matches the one the admin reviewed.

import type { InvitationEntry } from "@/utils/invitations";
import type { BuiltReview } from "@/utils/roster/review";
import {
  ROSTER_OWNED_FIELDS,
  type RosterOwnedField,
} from "@repo/domain/roster/types";

/** Invitations go out at 10 per second: 100 keep an apply well within the route's time limit. */
export const MAX_APPLY_INVITES = 100;
export const MAX_APPLY_UPDATES = 500;

export interface ApplyUpdate {
  profileId: string;
  fields: RosterOwnedField[];
}

export interface ApplyRequest {
  fingerprint: string;
  invite: string[];
  update: ApplyUpdate[];
}

export interface ApplyItemResult {
  kind: "invite" | "update";
  /** The row id (invite) or the profile id (update). */
  id: string;
  /** Who it concerns: name and email, for the result list. */
  label: string;
  status: "done" | "failed";
  /** French, when `failed`. */
  reason?: string;
  /** French, when `done` with a caveat the admin should know. */
  warning?: string;
  /** The fields written, when an update was done. */
  fields?: RosterOwnedField[];
}

export interface ApplySummary {
  done: number;
  failed: number;
  invited: number;
  updated: number;
}

export type ApplyOutcome =
  | { status: 200; body: { results: ApplyItemResult[]; summary: ApplySummary } }
  | { status: 400 | 409; body: { error: string } };

export type UpdateProfileResult =
  { ok: true; warning?: string } | { ok: false; reason: string };

export const ROSTER_CHANGED_MESSAGE =
  "Le tableau des membres a changé depuis la vérification. Relisez-le, puis choisissez à nouveau ce qu'il faut appliquer.";

export interface ApplyDeps {
  /** Re-reads the roster and the profiles. */
  buildReview: () => Promise<BuiltReview>;
  /** Writes the patch; a French `reason` on failure, an optional `warning` when done. */
  updateProfile: (
    profileId: string,
    patch: Partial<Record<RosterOwnedField, string>>,
  ) => Promise<UpdateProfileResult>;
  /** The shared, throttled invitation sender. */
  sendInvitations: (
    entries: InvitationEntry[],
  ) => Promise<
    Array<{ email: string; success: boolean; error?: string; userId?: string }>
  >;
  /** One log entry per invitation sent. Must not throw. */
  logInvitation: (entry: {
    userId?: string;
    email: string;
    displayName: string;
  }) => Promise<void>;
  /** One log entry per profile updated. Must not throw. */
  logUpdate: (entry: { profileId: string; fields: RosterOwnedField[] }) => void;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string" && v !== "");

const isOwnedField = (value: unknown): value is RosterOwnedField =>
  typeof value === "string" &&
  (ROSTER_OWNED_FIELDS as readonly string[]).includes(value);

/** Shape check of the request body; the French message is for the admin. */
export function parseApplyRequest(
  body: unknown,
): { ok: true; request: ApplyRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Requête invalide." };
  }
  const {
    fingerprint,
    invite = [],
    update = [],
  } = body as Record<string, unknown>;
  if (typeof fingerprint !== "string" || fingerprint === "") {
    return { ok: false, error: "L'empreinte du tableau est requise." };
  }
  if (!isStringArray(invite)) {
    return { ok: false, error: "La liste des invitations est invalide." };
  }
  if (!Array.isArray(update)) {
    return { ok: false, error: "La liste des mises à jour est invalide." };
  }
  // One entry per profile: the first one wins.
  const updatesById = new Map<string, ApplyUpdate>();
  for (const item of update) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "La liste des mises à jour est invalide." };
    }
    const { profileId, fields } = item as Record<string, unknown>;
    if (
      typeof profileId !== "string" ||
      profileId === "" ||
      !Array.isArray(fields) ||
      fields.length === 0 ||
      !fields.every(isOwnedField)
    ) {
      return { ok: false, error: "La liste des mises à jour est invalide." };
    }
    if (!updatesById.has(profileId)) {
      updatesById.set(profileId, {
        profileId,
        fields: Array.from(new Set(fields)),
      });
    }
  }
  const updates = Array.from(updatesById.values());
  const invites = Array.from(new Set(invite));
  if (invites.length === 0 && updates.length === 0) {
    return { ok: false, error: "Rien à appliquer." };
  }
  if (invites.length > MAX_APPLY_INVITES) {
    return {
      ok: false,
      error: `Au plus ${MAX_APPLY_INVITES} invitations par envoi : appliquez, puis recommencez.`,
    };
  }
  if (updates.length > MAX_APPLY_UPDATES) {
    return {
      ok: false,
      error: `Au plus ${MAX_APPLY_UPDATES} mises à jour par application.`,
    };
  }
  return {
    ok: true,
    request: { fingerprint, invite: invites, update: updates },
  };
}

const FIELD_LABELS: Record<RosterOwnedField, string> = {
  display_name: "nom",
  address: "adresse postale",
  home_phone: "téléphone fixe",
  voice: "voix",
};

export const fieldLabel = (field: RosterOwnedField): string =>
  FIELD_LABELS[field];

/** Runs the reviewed changes: updates first, then invitations in batches. */
export async function applyRosterSync(
  request: ApplyRequest,
  deps: ApplyDeps,
): Promise<ApplyOutcome> {
  const { review, diff } = await deps.buildReview();
  if (review.validation.errors.length > 0) {
    return {
      status: 409,
      body: {
        error: review.validation.errors[0]?.message ?? ROSTER_CHANGED_MESSAGE,
      },
    };
  }
  if (review.fingerprint !== request.fingerprint) {
    return { status: 409, body: { error: ROSTER_CHANGED_MESSAGE } };
  }

  const results: ApplyItemResult[] = [];
  const summary: ApplySummary = { done: 0, failed: 0, invited: 0, updated: 0 };
  const record = (result: ApplyItemResult) => {
    results.push(result);
    if (result.status === "done") {
      summary.done++;
      if (result.kind === "invite") summary.invited++;
      else summary.updated++;
    } else {
      summary.failed++;
    }
  };

  const changedById = new Map(diff.modifies.map((m) => [m.profileId, m]));
  for (const { profileId, fields } of request.update) {
    const member = changedById.get(profileId);
    if (!member) {
      record({
        kind: "update",
        id: profileId,
        label: profileId,
        status: "failed",
        reason: "Cette fiche n'a plus de modification en attente.",
      });
      continue;
    }
    const label = `${member.displayName} (${member.email})`;
    const patch: Partial<Record<RosterOwnedField, string>> = {};
    const written: RosterOwnedField[] = [];
    for (const change of member.changes) {
      if (fields.includes(change.field)) {
        patch[change.field] = change.to;
        written.push(change.field);
      }
    }
    if (written.length === 0) {
      record({
        kind: "update",
        id: profileId,
        label,
        status: "failed",
        reason: "Les champs choisis ne diffèrent plus du tableau.",
      });
      continue;
    }
    const result = await deps.updateProfile(profileId, patch);
    if (!result.ok) {
      record({
        kind: "update",
        id: profileId,
        label,
        status: "failed",
        reason: result.reason,
      });
      continue;
    }
    deps.logUpdate({ profileId, fields: written });
    record({
      kind: "update",
      id: profileId,
      label,
      status: "done",
      fields: written,
      ...(result.warning ? { warning: result.warning } : {}),
    });
  }

  const newByRowId = new Map(diff.nouveaux.map((n) => [n.rowId, n]));
  const toInvite: Array<InvitationEntry & { rowId: string }> = [];
  for (const rowId of request.invite) {
    const member = newByRowId.get(rowId);
    if (!member) {
      record({
        kind: "invite",
        id: rowId,
        label: rowId,
        status: "failed",
        reason:
          "Cette ligne n'est plus un nouveau membre : un compte existe peut-être déjà.",
      });
      continue;
    }
    toInvite.push({
      rowId,
      email: member.email,
      displayName: member.displayName,
    });
  }

  if (toInvite.length > 0) {
    const sent = await deps.sendInvitations(
      toInvite.map(({ email, displayName }) => ({ email, displayName })),
    );
    const byEmail = new Map(sent.map((r) => [r.email, r]));
    for (const entry of toInvite) {
      const label = `${entry.displayName} (${entry.email})`;
      const result = byEmail.get(entry.email);
      if (!result) {
        record({
          kind: "invite",
          id: entry.rowId,
          label,
          status: "failed",
          reason: "Aucune réponse du service d'invitation.",
        });
        continue;
      }
      if (!result.success) {
        record({
          kind: "invite",
          id: entry.rowId,
          label,
          status: "failed",
          reason: invitationFailure(result.error),
        });
        continue;
      }
      await deps.logInvitation({
        userId: result.userId,
        email: entry.email,
        displayName: entry.displayName,
      });
      record({ kind: "invite", id: entry.rowId, label, status: "done" });
    }
  }

  return { status: 200, body: { results, summary } };
}

/** Supabase Auth's English reasons, in French for the admin. */
export function invitationFailure(error: string | undefined): string {
  const text = (error ?? "").toLowerCase();
  if (
    text.includes("already been registered") ||
    text.includes("already exists")
  ) {
    return "Un compte existe déjà avec cet email.";
  }
  if (text.includes("rate limit")) {
    return "Limite d'envoi atteinte : réessayez dans quelques minutes.";
  }
  if (text.includes("invalid") && text.includes("email")) {
    return "Email refusé par le service d'envoi.";
  }
  return "L'invitation n'a pas pu être envoyée.";
}
