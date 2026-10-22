import assert from "node:assert/strict";
import { fillFromMember, matchMembers, memberOptions } from "./members";

const members = [
  { id: "1", name: "Léa MARTIN", email: "lea@exemple.org" },
  { id: "2", name: "Hélène DUPONT", email: "helene@exemple.org" },
  { id: "3", name: "Marc LÉANDRE", email: "marc@exemple.org" },
  { id: "4", name: "Anne-Léa ROUX", email: "anne@exemple.org" },
];

// Two letters at least, accents and capitals ignored.
assert.deepEqual(matchMembers(members, "l"), []);
assert.deepEqual(
  matchMembers(members, "lea").map((m) => m.id),
  ["4", "1", "3"],
  "names starting with the word first, then by name",
);
assert.deepEqual(
  matchMembers(members, "LÉA mart").map((m) => m.id),
  ["1"],
  "every word must match",
);
assert.deepEqual(
  matchMembers(members, "helene@").map((m) => m.id),
  ["2"],
  "the e-mail counts",
);
assert.equal(matchMembers(members, "lea", 1).length, 1);

// Picking fills the empty fields only.
const lea = {
  id: "1",
  name: "Léa MARTIN",
  phone: "+33612345678",
  address: "1 rue de l'Exemple 67000 Strasbourg",
};
assert.deepEqual(fillFromMember(lea, { buyer_phone: "", buyer_address: " " }), {
  buyer_name: "Léa MARTIN",
  buyer_phone: "06 12 34 56 78",
  buyer_address: "1 rue de l'Exemple 67000 Strasbourg",
});
assert.deepEqual(
  fillFromMember(lea, {
    buyer_phone: "07 00 00 00 00",
    buyer_address: "Ailleurs",
  }),
  {
    buyer_name: "Léa MARTIN",
    buyer_phone: "07 00 00 00 00",
    buyer_address: "Ailleurs",
  },
);
assert.deepEqual(
  fillFromMember(
    { id: "2", name: "Hélène DUPONT" },
    {
      buyer_phone: "",
      buyer_address: "",
    },
  ),
  { buyer_name: "Hélène DUPONT", buyer_phone: "", buyer_address: "" },
);

// Options from the users list: mobile first, sorted by name.
assert.deepEqual(
  memberOptions(
    [
      { id: "b", email: "b@exemple.org", home_phone: "03 88 00 00 00" },
      {
        id: "a",
        email: "a@exemple.org",
        mobile_phone: "06 11 11 11 11",
        home_phone: "03 88 11 11 11",
        address: " ",
      },
    ],
    (u) => (u.id === "a" ? "Alice TEST" : "Bruno TEST"),
  ),
  [
    {
      id: "a",
      name: "Alice TEST",
      email: "a@exemple.org",
      phone: "06 11 11 11 11",
      address: null,
    },
    {
      id: "b",
      name: "Bruno TEST",
      email: "b@exemple.org",
      phone: "03 88 00 00 00",
      address: null,
    },
  ],
);

console.log("orders/members: ok");
