// utils/mailing-list/run.ts
//
// Server-only glue for the comparison between the member roster and a
// mailing list: reads the roster (Google Sheet), the group (Apps Script) and
// the exceptions, runs the pure comparison, and records the outcome (counts
// only) in `mailing_list_comparisons`, which check-ops-alerts watches.

import {
  fetchGroupMemberEmails,
  GroupSourceError,
} from "@/utils/google-groups/source";
import {
  fetchRosterRows,
  RosterSourceError,
  type RosterRead,
} from "@/utils/roster/source";
import type { createAdminClient } from "@/utils/supabase/admin";
import {
  compareMailingList,
  type MailingListComparison,
} from "@repo/domain/roster/mailingList";
import { parseRoster } from "@repo/domain/roster/validate";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ComparisonTrigger = "manual" | "cron";

export interface ComparisonDeps {
  fetchRosterRows: () => Promise<RosterRead>;
  fetchGroupMemberEmails: (groupEmail: string) => Promise<string[]>;
  now: () => Date;
}

const DEFAULT_DEPS: ComparisonDeps = {
  fetchRosterRows,
  fetchGroupMemberEmails,
  now: () => new Date(),
};

export type ComparisonOutcome =
  | { ok: true; checkedAt: string; comparison: MailingListComparison }
  | { ok: false; checkedAt: string; error: string };

/** French message for a failure, safe to show and to push. */
function failureMessage(error: unknown): string {
  if (error instanceof RosterSourceError) return error.userMessage;
  if (error instanceof GroupSourceError) return error.userMessage;
  return "La comparaison a échoué.";
}

/**
 * Compares one enabled list with the roster and records the outcome. Never
 * throws for a source failure: it is recorded and returned as `ok: false`.
 */
export async function runMailingListComparison(
  supabase: AdminClient,
  groupEmail: string,
  trigger: ComparisonTrigger,
  deps: ComparisonDeps = DEFAULT_DEPS,
): Promise<ComparisonOutcome> {
  const checkedAt = deps.now().toISOString();
  let outcome: ComparisonOutcome;

  try {
    const [exceptions, read, listEmails, profiles] = await Promise.all([
      supabase
        .from("mailing_list_exceptions")
        .select("email, note")
        .eq("group_email", groupEmail),
      deps.fetchRosterRows(),
      deps.fetchGroupMemberEmails(groupEmail),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    if (exceptions.error) throw exceptions.error;
    if (profiles.error) throw profiles.error;

    const parsed = parseRoster(read.rows, {
      activeProfilesCount: profiles.count ?? 0,
      rowsAboveHeader: read.rowsAboveHeader,
    });
    // A roster that fails validation (no header, collapsed rows) would make
    // every address look missing or extra: nothing is compared.
    if (parsed.errors.length > 0) {
      outcome = {
        ok: false,
        checkedAt,
        error: `Le tableau des membres n'a pas pu être lu : ${parsed.errors[0]!.message}`,
      };
    } else {
      outcome = {
        ok: true,
        checkedAt,
        comparison: compareMailingList(
          parsed.rows,
          listEmails,
          exceptions.data ?? [],
        ),
      };
    }
  } catch (error) {
    console.error(
      `Mailing list comparison (${trigger}) failed:`,
      error instanceof Error ? error.message : error,
    );
    outcome = { ok: false, checkedAt, error: failureMessage(error) };
  }

  const record = outcome.ok
    ? {
        checked_at: checkedAt,
        status: "ok",
        missing_count: outcome.comparison.missing.length,
        extra_count: outcome.comparison.extra.length,
        error: null,
      }
    : {
        checked_at: checkedAt,
        status: "failed",
        error: outcome.error.slice(0, 500),
      };
  const { error: writeError } = await supabase
    .from("mailing_list_comparisons")
    .update(
      trigger === "cron" ? { ...record, cron_checked_at: checkedAt } : record,
    )
    .eq("group_email", groupEmail);
  if (writeError) {
    // The page still shows the result; only the alert misses this run.
    console.error(
      "Recording the mailing list comparison failed:",
      writeError.message,
    );
  }

  return outcome;
}
