// The admin's TanStack Query defaults: a failed write is never re-sent on
// its own (a save whose answer was lost may have gone through, and sending
// it again records it twice), while reads keep their two retries.
import { MutationObserver } from "@tanstack/react-query";
import assert from "node:assert/strict";
import { queryClient } from "./query-client";

const defaults = queryClient.getDefaultOptions();
assert.equal(defaults.queries?.retry, 2);
assert.equal(defaults.mutations?.retry, 0);

// Behaviour, not only the option: a mutation whose request fails runs its
// function exactly once and reports the failure.
{
  let calls = 0;
  const observer = new MutationObserver(queryClient, {
    mutationFn: async (payload: { amount: number }) => {
      calls += 1;
      throw new Error(`réseau coupé (${payload.amount})`);
    },
    // Lets the process exit: no 5-minute garbage-collection timer.
    gcTime: 0,
  });
  await assert.rejects(observer.mutate({ amount: 12 }), /réseau coupé \(12\)/);
  assert.equal(calls, 1);
}

// A mutation can still opt into retries on its own when that is safe.
{
  let calls = 0;
  const observer = new MutationObserver(queryClient, {
    mutationFn: async () => {
      calls += 1;
      throw new Error("encore");
    },
    retry: 1,
    retryDelay: 0,
    gcTime: 0,
  });
  await assert.rejects(observer.mutate(), /encore/);
  assert.equal(calls, 2);
}

console.log("lib/query-client: all assertions passed");
