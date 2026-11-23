// Static renders of the « Groupes » building blocks (react-dom/server).
import type { GroupMember, GroupSummary } from "@/utils/groups/types";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GroupCard } from "./GroupCard";
import { GroupTile } from "./GroupIcon";
import { GroupMembers } from "./GroupMembers";

const noop = async () => {};
const person = (id: string, name: string) => ({
  id,
  name,
  email: `${id}@example.test`,
  avatar: null,
});

const ca: GroupSummary = {
  id: "00000000-0000-4000-8000-00000000000a",
  name: "Conseil d’administration",
  slug: "ca",
  kind: "instance",
  description: "Les membres élus par l’assemblée générale.",
  color: "teal",
  icon: "landmark",
  visibility: "private",
  is_system: true,
  archived_at: null,
  created_by: null,
  created_at: "2026-11-23T18:00:00Z",
  updated_at: "2026-11-23T18:00:00Z",
  member_ids: ["a", "b", "c", "d", "e", "f", "g"],
  preview: ["a", "b", "c", "d", "e"].map((id) =>
    person(id, `Personne ${id.toUpperCase()}`),
  ),
  managers: ["Claire MARTIN"],
  next_event: {
    id: "e",
    title: "Réunion du CA",
    date_from: "2026-12-03",
    date_to: null,
    time: "20:00:00",
    location: "Wangen",
  },
};

// --- A card: badges, faces then « +2 », count, managers, next event, link ---
{
  const html = renderToStaticMarkup(createElement(GroupCard, { group: ca }));
  assert.match(html, /Conseil d’administration/);
  assert.match(html, />Instance</);
  assert.match(html, /Privé/);
  assert.match(html, /\+2/);
  assert.match(html, /7 membres/);
  assert.match(html, /Responsable : Claire MARTIN/);
  assert.match(html, /Prochain : Réunion du CA · Jeudi 3 décembre 2026/);
  assert.match(
    html,
    /href="\/dashboard\/admin\/groups\/00000000-0000-4000-8000-00000000000a"/,
  );
  assert.doesNotMatch(html, /Archivé/);
}
{
  const html = renderToStaticMarkup(
    createElement(GroupCard, {
      group: {
        ...ca,
        visibility: "members",
        archived_at: "2026-11-23T19:00:00Z",
        member_ids: [],
        preview: [],
        managers: [],
        next_event: null,
      },
    }),
  );
  assert.match(html, /Visible des membres/);
  assert.match(html, /Archivé/);
  assert.match(html, /Aucun membre/);
  assert.match(html, /Aucun événement prévu/);
  assert.doesNotMatch(html, /Responsable/);
}

// --- A tile: decorative, tinted with tokens, an unknown icon still draws ---
{
  const html = renderToStaticMarkup(
    createElement(GroupTile, { icon: "not-an-icon", color: "gold" }),
  );
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /bg-warning-soft text-warning-foreground/);
  assert.match(html, /<svg/);
}

// --- Members: « Responsable » badge, function, menu per person ---
{
  const members: GroupMember[] = [
    {
      ...person("c", "Claire MARTIN"),
      role: "manager",
      title: "Présidente",
      added_at: "",
    },
    {
      ...person("j", "Jean DUPONT"),
      role: "member",
      title: null,
      added_at: "",
    },
  ];
  const html = renderToStaticMarkup(
    createElement(GroupMembers, {
      groupName: "Conseil d’administration",
      members,
      candidates: [],
      archived: false,
      onAdd: noop,
      onRole: noop,
      onTitle: noop,
      onRemove: noop,
    }),
  );
  assert.match(html, /2 membres/);
  assert.match(html, /Responsable/);
  assert.match(html, /Présidente · c@example.test/);
  assert.match(html, /Plus d&#x27;actions pour Jean DUPONT/);
  assert.match(html, /href="\/dashboard\/admin\/users\/j"/);
}
{
  const html = renderToStaticMarkup(
    createElement(GroupMembers, {
      groupName: "Bureau",
      members: [],
      candidates: [],
      archived: true,
      onAdd: noop,
      onRole: noop,
      onTitle: noop,
      onRemove: noop,
    }),
  );
  assert.match(html, /Personne dans ce groupe/);
  assert.match(html, /Rétablissez le groupe pour y ajouter des membres/);
}

console.log("groups components: all assertions passed");
