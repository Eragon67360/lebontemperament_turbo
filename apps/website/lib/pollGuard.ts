/**
 * Keeps a poll to one request at a time. A request started while another
 * is pending is refused, so requests don't pile up on a slow connection,
 * and an answer that arrives after a newer request started is reported as
 * stale, so an older state never lands over a newer one. A request pending
 * for longer than `pendingLimitMs` no longer blocks the next one: a hung
 * connection can't stop the poll, and its answer, if it ever comes, is
 * stale.
 */
export interface PollGuard {
  /** Starts a request: its number, or `null` while another is pending. */
  begin(): number | null;
  /**
   * Ends request `id`: `true` when it is the latest one, so its answer may
   * be applied; `false` for a stale one.
   */
  settle(id: number): boolean;
}

export function createPollGuard(
  pendingLimitMs: number,
  now: () => number = Date.now,
): PollGuard {
  let pendingSince: number | null = null;
  let latest = 0;
  return {
    begin() {
      if (pendingSince !== null && now() - pendingSince < pendingLimitMs) {
        return null;
      }
      pendingSince = now();
      latest += 1;
      return latest;
    },
    settle(id) {
      if (id !== latest) return false;
      pendingSince = null;
      return true;
    },
  };
}
