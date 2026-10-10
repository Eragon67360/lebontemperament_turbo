import assert from "node:assert/strict";
import { type InviteClient, sendInvitations } from "./invitations";

// Every invitation stores the name as « Prénom NOM », however it was typed or
// imported (the CSV's « NOM Prénom » column included).

const sent: { email: string; name: unknown }[] = [];
const client: InviteClient = {
  auth: {
    admin: {
      async inviteUserByEmail(email, options) {
        sent.push({ email, name: options.data?.display_name });
        return { data: { user: { id: `id-${email}` } }, error: null };
      },
    },
  },
};

const results = await sendInvitations(
  client,
  [
    { email: "a@example.com", displayName: "BERNARD Lucie" },
    { email: "b@example.com", displayName: "DE LA FONTAINE Jean  Marie" },
    { email: "c@example.com", displayName: "Paul MARTIN" },
    { email: "d@example.com", displayName: "Claire Dubois" },
  ],
  {
    invitedBy: "admin",
    redirectTo: "https://example.com",
    sleep: async () => {},
  },
);

assert.deepEqual(
  sent.map((s) => s.name),
  [
    "Lucie BERNARD",
    "Jean Marie DE LA FONTAINE",
    "Paul MARTIN",
    "Claire Dubois",
  ],
);
assert.deepEqual(
  results.map((r) => r.displayName),
  [
    "Lucie BERNARD",
    "Jean Marie DE LA FONTAINE",
    "Paul MARTIN",
    "Claire Dubois",
  ],
);

console.log("invitations: names stored as « Prénom NOM »");
