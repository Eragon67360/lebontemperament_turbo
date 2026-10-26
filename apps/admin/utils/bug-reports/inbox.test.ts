// « Mes signalements »: the messages of every report of the inbox come in one
// query, whatever the number of reports (one per 1000 messages, Supabase's
// cap for one answer), and are summarized per report in memory (count, last
// message, unread for the reader). Fake ids only.
import type { createClient } from "@/utils/supabase/server";
import assert from "node:assert/strict";
import {
  loadMessageSummaries,
  summarizeMessages,
  type MessageRow,
} from "./inbox";

type Client = Awaited<ReturnType<typeof createClient>>;

const me = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";

const row = (
  n: number,
  bug_report_id: string,
  from: string,
  to: string,
  is_read = true,
): MessageRow => ({
  id: `m${n}`,
  bug_report_id,
  created_at: `2026-10-0${n}T10:00:00Z`,
  message: `Message ${n}`,
  sender_id: from,
  receiver_id: to,
  is_read,
});

// --- Count, last message (oldest first in), unread: mine to read only ---
{
  const summaries = summarizeMessages(
    [
      row(1, "b1", other, me, false),
      row(2, "b1", me, other, false), // the other's to read, not mine
      row(3, "b2", other, me, true),
      row(4, "b1", other, me, false),
    ],
    me,
  );
  assert.deepEqual(summaries.get("b1"), {
    last_message: {
      id: "m4",
      created_at: "2026-10-04T10:00:00Z",
      message: "Message 4",
      sender_id: other,
      is_read: false,
    },
    message_count: 3,
    unread_count: 2,
  });
  assert.deepEqual(summaries.get("b2"), {
    last_message: {
      id: "m3",
      created_at: "2026-10-03T10:00:00Z",
      message: "Message 3",
      sender_id: other,
      is_read: true,
    },
    message_count: 1,
    unread_count: 0,
  });
  // No message yet: absent (the route shows zeros).
  assert.equal(summaries.get("b3"), undefined);
  assert.equal(summaries.size, 2);
  assert.deepEqual(summarizeMessages([], me).size, 0);
}

// --- One query for all the reports, through the caller's client ---
type Call = { table: string; chain: [string, ...unknown[]][] };

/** Answers the queries in order; the last answer repeats. */
function fakeClient(...answers: { data: unknown; error: unknown }[]) {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, chain: [] };
      const builder: Record<string, unknown> = {
        then(resolve: (value: unknown) => unknown) {
          calls.push(call);
          const answer = answers[Math.min(calls.length, answers.length) - 1];
          return Promise.resolve(answer).then(resolve);
        },
      };
      for (const method of ["select", "in", "order", "range"]) {
        builder[method] = (...args: unknown[]) => {
          call.chain.push([method, ...args]);
          return builder;
        };
      }
      return builder;
    },
  } as unknown as Client;
  return { client, calls };
}

async function main() {
  {
    const { client, calls } = fakeClient({
      data: [row(1, "b1", other, me, false), row(2, "b2", me, other, false)],
      error: null,
    });
    const result = await loadMessageSummaries(client, me, ["b1", "b2", "b3"]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.table, "bug_messages");
    assert.deepEqual(
      calls[0]?.chain.find(([method]) => method === "in"),
      ["in", "bug_report_id", ["b1", "b2", "b3"]],
    );
    assert.deepEqual(
      calls[0]?.chain.find(([method]) => method === "order"),
      ["order", "created_at", { ascending: true }],
    );
    assert.ok(result.ok);
    assert.equal(result.summaries.get("b1")?.unread_count, 1);
    assert.equal(result.summaries.get("b2")?.unread_count, 0);
    assert.equal(result.summaries.get("b2")?.last_message?.id, "m2");
  }
  // Past 1000 messages, the next page is read too: nothing is cut.
  {
    const fullPage = Array.from({ length: 1000 }, () =>
      row(1, "b1", other, me, false),
    );
    const { client, calls } = fakeClient(
      { data: fullPage, error: null },
      { data: [row(2, "b1", other, me, true)], error: null },
    );
    const result = await loadMessageSummaries(client, me, ["b1"]);
    assert.equal(calls.length, 2);
    assert.deepEqual(
      calls.map((call) => call.chain.find(([method]) => method === "range")),
      [
        ["range", 0, 999],
        ["range", 1000, 1999],
      ],
    );
    assert.ok(result.ok);
    assert.equal(result.summaries.get("b1")?.message_count, 1001);
    assert.equal(result.summaries.get("b1")?.unread_count, 1000);
    assert.equal(result.summaries.get("b1")?.last_message?.id, "m2");
  }
  // A failed read is reported, never shown as « no messages ».
  {
    const { client } = fakeClient({
      data: null,
      error: { message: "lecture impossible" },
    });
    const result = await loadMessageSummaries(client, me, ["b1"]);
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.error.message, "lecture impossible");
  }
  console.log("bug-reports/inbox: all assertions passed");
}

main();
