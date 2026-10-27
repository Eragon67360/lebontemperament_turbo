// Tests google-apps-script/Code.gs, the Apps Script web app the owner pastes
// into script.google.com. It lives here because the test runner only scans
// utils/, lib/, components/ and app/. The script runs in a `vm` context with
// stubs for the Apps Script services it uses; everything is fake (example.com
// addresses, a made-up key) and nothing leaves the process.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const CODE = readFileSync(
  new URL("../../google-apps-script/Code.gs", import.meta.url),
  "utf8",
);

const KEY = "test-key-".repeat(5);
const ALLOWED = "newsletter@example.com";
const OTHER = "board@example.com";
const GROUPS: Record<string, string[]> = {
  [ALLOWED]: ["member@example.com", "other.member@example.com"],
  [OTHER]: ["board.member@example.com"],
};
const REFUSED = {
  success: false,
  message: "Accès refusé",
  data: [],
  stats: null,
};

interface ScriptAnswer {
  success: boolean;
  message: string;
  data: unknown[];
  stats: Record<string, unknown> | null;
}

/** Loads Code.gs with these Script Properties and the GROUPS above. */
function loadScript(properties: Record<string, string>) {
  const logs: string[] = [];
  const groupsRead: string[] = [];
  let groupsListed = 0;

  const context = createContext({
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text: string) => ({
        setMimeType: (mimeType: string) => ({ text, mimeType }),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (name: string) => properties[name] ?? null,
      }),
    },
    GroupsApp: {
      getGroups: () => {
        groupsListed++;
        return Object.keys(GROUPS).map((email) => ({ getEmail: () => email }));
      },
      getGroupByEmail: (email: string) => {
        groupsRead.push(email);
        const members = GROUPS[email];
        return members
          ? { getUsers: () => members.map((m) => ({ getEmail: () => m })) }
          : null;
      },
    },
    Logger: { log: (message: unknown) => logs.push(String(message)) },
  });
  runInContext(CODE, context, { filename: "Code.gs" });
  const script = context as { doGet: (e?: unknown) => unknown };

  return {
    logs,
    groupsRead,
    groupsListed: () => groupsListed,
    /** doGet as a web request with these query parameters (none: no event). */
    get(parameter?: Record<string, string>): ScriptAnswer {
      const output = script.doGet(
        parameter === undefined ? undefined : { parameter },
      ) as { text: string; mimeType: string };
      assert.equal(output.mimeType, "application/json");
      return JSON.parse(output.text) as ScriptAnswer;
    },
  };
}

const CONFIGURED = {
  LBT_SCRIPT_KEY: KEY,
  // Spaces, capitals and an empty entry are tolerated.
  LBT_ALLOWED_GROUPS: " Newsletter@Example.com , ,choir@example.com",
};

// --- Without the right key: the same refusal, and no group is read ---
{
  const script = loadScript(CONFIGURED);
  const wrongKeys = [
    undefined, // no key parameter
    "",
    "x".repeat(KEY.length), // same length
    KEY.slice(0, -1), // one character short
    KEY + "x", // one character too many
    KEY.toUpperCase(),
    ` ${KEY}`,
  ];
  for (const key of wrongKeys) {
    const parameter: Record<string, string> = { groupEmail: ALLOWED };
    if (key !== undefined) parameter.key = key;
    assert.deepEqual(script.get(parameter), REFUSED, `key ${key}`);
    assert.deepEqual(
      script.get({ ...parameter, action: "list-groups" }),
      REFUSED,
      `list-groups, key ${key}`,
    );
  }
  // Run from the editor, doGet gets no event at all.
  assert.deepEqual(script.get(), REFUSED);
  assert.deepEqual(script.groupsRead, []);
  assert.equal(script.groupsListed(), 0);
}

// --- The right key and a listed group: its members ---
{
  const script = loadScript(CONFIGURED);
  const answer = script.get({ key: KEY, groupEmail: ALLOWED });
  assert.equal(answer.success, true);
  assert.equal(answer.message, "Membres récupérés avec succès");
  assert.deepEqual(answer.data, GROUPS[ALLOWED]);
  const { retrievedAt, ...stats } = answer.stats ?? {};
  assert.deepEqual(stats, {
    total: 2,
    groupEmail: ALLOWED,
    groupName: ALLOWED,
    description: null,
  });
  assert.ok(!Number.isNaN(Date.parse(String(retrievedAt))));

  // Group addresses compare without case or surrounding spaces.
  const loud = script.get({ key: KEY, groupEmail: " NEWSLETTER@example.COM " });
  assert.deepEqual(loud.data, GROUPS[ALLOWED]);
  assert.deepEqual(script.groupsRead, [ALLOWED, ALLOWED]);
}

// --- The right key and a group outside the list: refused, never read ---
{
  const script = loadScript(CONFIGURED);
  assert.deepEqual(script.get({ key: KEY, groupEmail: OTHER }), REFUSED);
  assert.deepEqual(script.get({ key: KEY }), REFUSED, "no group named");
  assert.deepEqual(script.get({ key: KEY, groupEmail: "" }), REFUSED);
  assert.deepEqual(
    script.get({ key: KEY, groupEmail: `${ALLOWED},${OTHER}` }),
    REFUSED,
  );
  assert.deepEqual(script.groupsRead, []);
}

// --- A listed group the account doesn't see: "not found", as before ---
{
  const script = loadScript(CONFIGURED);
  const answer = script.get({ key: KEY, groupEmail: "choir@example.com" });
  assert.equal(answer.success, false);
  assert.deepEqual(answer.data, []);
}

// --- list-groups: only the listed groups, in the shape the admin reads ---
{
  const script = loadScript(CONFIGURED);
  const answer = script.get({ key: KEY, action: "list-groups" });
  assert.equal(answer.success, true);
  assert.equal(answer.message, "Groupes récupérés avec succès");
  assert.deepEqual(answer.data, [
    { email: ALLOWED, name: ALLOWED, description: null },
  ]);
  assert.equal(answer.stats?.total, 1);
  assert.ok(!Number.isNaN(Date.parse(String(answer.stats?.retrievedAt))));
}

// --- No allowlist: every group refused, and list-groups lists none ---
{
  const script = loadScript({ LBT_SCRIPT_KEY: KEY });
  assert.deepEqual(script.get({ key: KEY, groupEmail: ALLOWED }), REFUSED);
  const answer = script.get({ key: KEY, action: "list-groups" });
  assert.equal(answer.success, true);
  assert.deepEqual(answer.data, []);
  assert.deepEqual(script.groupsRead, []);
}

// --- No key configured, or one too short to be safe: everything refused ---
const UNSAFE: Record<string, string>[] = [
  { LBT_ALLOWED_GROUPS: ALLOWED },
  { LBT_SCRIPT_KEY: "", LBT_ALLOWED_GROUPS: ALLOWED },
  { LBT_SCRIPT_KEY: "   ", LBT_ALLOWED_GROUPS: ALLOWED },
  { LBT_SCRIPT_KEY: "short-key", LBT_ALLOWED_GROUPS: ALLOWED },
];
for (const properties of UNSAFE) {
  const script = loadScript(properties);
  for (const key of [undefined, "", "null", "undefined", "short-key", KEY]) {
    const parameter: Record<string, string> = { groupEmail: ALLOWED };
    if (key !== undefined) parameter.key = key;
    assert.deepEqual(script.get(parameter), REFUSED);
    assert.deepEqual(
      script.get({ ...parameter, action: "list-groups" }),
      REFUSED,
    );
  }
  assert.deepEqual(script.groupsRead, []);
  assert.equal(script.groupsListed(), 0);
}

// --- A key pasted with a stray space or line break still matches ---
{
  const script = loadScript({ ...CONFIGURED, LBT_SCRIPT_KEY: ` ${KEY}\n` });
  assert.equal(script.get({ key: KEY, groupEmail: ALLOWED }).success, true);
}

// --- The logs never hold a key, right or wrong ---
{
  const script = loadScript(CONFIGURED);
  const wrong = "wrong-key-".repeat(5);
  script.get({ key: wrong, groupEmail: ALLOWED });
  script.get({ key: KEY, groupEmail: ALLOWED });
  script.get({ key: KEY, groupEmail: OTHER });
  script.get({ key: KEY, action: "list-groups" });
  assert.ok(script.logs.length > 0, "the script still logs what it does");
  for (const line of script.logs) {
    assert.ok(!line.includes(KEY), `a log line holds the key: ${line}`);
    assert.ok(!line.includes(wrong), `a log line holds a key: ${line}`);
  }
}

console.log("✔ google-apps-script/Code.gs");
