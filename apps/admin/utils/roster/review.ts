// utils/roster/review.ts
//
// Server-only glue for the roster sync: reads the roster and the profiles,
// then runs the pure domain functions (validate → diff → fingerprint). The
// GET route answers with `review`; the apply route re-runs it to check the
// fingerprint and to take the values it writes from the server's own diff.

import type { RosterRead } from "@/utils/roster/source";
import { createAdminClient } from "@/utils/supabase/admin";
import { inviteStatusOf, listAuthSummaries } from "@/utils/users/authUsers";
import { diffRoster } from "@repo/domain/roster/diff";
import { rosterFingerprint } from "@repo/domain/roster/fingerprint";
import { DEFAULT_KNOWN_VOICES } from "@repo/domain/roster/normalize";
import type {
  ProfileForDiff,
  RosterDiff,
  RosterReview,
  RosterRow,
} from "@repo/domain/roster/types";
import { parseRoster } from "@repo/domain/roster/validate";
import { createHash } from "node:crypto";

export const sha256Hex = (input: string): string =>
  createHash("sha256").update(input).digest("hex");

export interface RosterReviewDeps {
  fetchRosterRows: () => Promise<RosterRead>;
  loadProfiles: () => Promise<ProfileForDiff[]>;
  knownVoices?: readonly string[];
}

export interface BuiltReview {
  review: RosterReview;
  diff: RosterDiff;
  rows: RosterRow[];
}

const EMPTY_DIFF: RosterDiff = {
  nouveaux: [],
  modifies: [],
  absents: [],
  aRegler: [],
  unchanged: 0,
};

export async function buildRosterReview(
  deps: RosterReviewDeps,
): Promise<BuiltReview> {
  const knownVoices = deps.knownVoices ?? DEFAULT_KNOWN_VOICES;
  const [read, profiles] = await Promise.all([
    deps.fetchRosterRows(),
    deps.loadProfiles(),
  ]);
  const parsed = parseRoster(read.rows, {
    activeProfilesCount: profiles.length,
    knownVoices,
    rowsAboveHeader: read.rowsAboveHeader,
  });
  // Nothing is compared on a roster that fails validation.
  const diff =
    parsed.errors.length === 0
      ? diffRoster(parsed.rows, profiles, knownVoices)
      : EMPTY_DIFF;
  const { unchanged, ...groups } = diff;
  return {
    rows: parsed.rows,
    diff,
    review: {
      fingerprint: rosterFingerprint(parsed.rows, sha256Hex),
      rowCount: parsed.rows.length,
      validation: { errors: parsed.errors, warnings: parsed.warnings },
      groups,
      unchanged,
    },
  };
}

/** Profiles with their invite status, as the diff needs them. */
export async function loadProfilesForDiff(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
): Promise<ProfileForDiff[]> {
  const [{ data: profiles, error }, authUsers] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, role, address, home_phone, voice"),
    listAuthSummaries(supabaseAdmin),
  ]);
  if (error) throw error;
  const authById = new Map(authUsers.map((user) => [user.id, user]));
  return (profiles ?? []).map((profile) => ({
    ...profile,
    status: inviteStatusOf(authById.get(profile.id)),
  }));
}
