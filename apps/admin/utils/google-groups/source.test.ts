import { GROUPS_PRODUCTION_ONLY_MESSAGE } from "@/utils/memberLists";
import assert from "node:assert/strict";
import { fetchGroupMemberEmails, GroupSourceError } from "./source";

// Only production calls the Apps Script that reads the Google Groups
// (SEC-007). Fake script URL and addresses; `fetch` is mocked, nothing leaves
// the process.

const originalFetch = globalThis.fetch;
const saved = {
  scriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL,
  vercelEnv: process.env.VERCEL_ENV,
  optIn: process.env.ALLOW_MEMBER_LISTS_IN_DEVELOPMENT,
};

let requests = 0;
globalThis.fetch = (async () => {
  requests++;
  return Response.json({
    success: true,
    data: [{ email: "membre@example.com" }, "autre@example.com"],
  });
}) as typeof fetch;
process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.example.com/exec";

function setEnvironment(vercelEnv?: string, optIn?: string) {
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
  if (optIn === undefined) delete process.env.ALLOW_MEMBER_LISTS_IN_DEVELOPMENT;
  else process.env.ALLOW_MEMBER_LISTS_IN_DEVELOPMENT = optIn;
}

try {
  for (const [vercelEnv, optIn] of [
    ["preview", undefined],
    ["preview", "1"],
    ["development", undefined],
    [undefined, undefined],
  ] as const) {
    setEnvironment(vercelEnv, optIn);
    await assert.rejects(
      fetchGroupMemberEmails("liste@example.com"),
      (error: unknown) => {
        assert.ok(error instanceof GroupSourceError);
        assert.equal(error.userMessage, GROUPS_PRODUCTION_ONLY_MESSAGE);
        return true;
      },
    );
  }
  assert.equal(requests, 0, "the script is not called outside production");

  setEnvironment("production");
  assert.deepEqual(await fetchGroupMemberEmails("liste@example.com"), [
    "membre@example.com",
    "autre@example.com",
  ]);
  setEnvironment(undefined, "1");
  assert.equal((await fetchGroupMemberEmails("liste@example.com")).length, 2);
  assert.equal(requests, 2);
} finally {
  globalThis.fetch = originalFetch;
  if (saved.scriptUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
  else process.env.GOOGLE_APPS_SCRIPT_URL = saved.scriptUrl;
  setEnvironment(saved.vercelEnv, saved.optIn);
}

console.log("google-groups/source.test.ts: production only");
