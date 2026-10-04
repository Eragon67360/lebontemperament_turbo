import assert from "node:assert/strict";
import { JOB_IDS, jobLinks, jobStatusLines } from "./jobs";

const now = new Date(2026, 9, 3, 10, 0, 0);

// --- Links: one or two per job, Signalements only for a superadmin ---
{
  for (const id of JOB_IDS) {
    const links = jobLinks(id, false);
    assert.ok(links.length >= 1 && links.length <= 2, id);
    for (const link of links) {
      assert.ok(link.href.startsWith("/dashboard/"), link.label);
    }
  }
  assert.deepEqual(
    jobLinks("association", false).map((link) => link.label),
    ["Comptes rendus du CA"],
  );
  assert.deepEqual(
    jobLinks("association", true).map((link) => link.label),
    ["Comptes rendus du CA", "Signalements"],
  );
  assert.equal(
    jobLinks("campaign", false)[0]!.href,
    "/dashboard/admin/anniversary",
  );
}

// --- Status lines come only from facts that are present ---
{
  const lines = jobStatusLines({}, now);
  for (const id of JOB_IDS) assert.deepEqual(lines[id], []);
}

{
  const lines = jobStatusLines(
    {
      campaignPublished: false,
      readiness: {
        ready: 7,
        total: 10,
        pendingMemories: 3,
        sectionsToComplete: 2,
        sectionLabels: ["Chronologie", "Souvenirs audio"],
      },
      nextConcert: { startsAt: new Date(2026, 10, 15, 20, 30) },
      driveSync: null,
      lastDriveSync: {
        when: "03/10/2026 03:31",
        counts: { added: 12, renamed: 0, moved: 0, removed: 0 },
      },
      nextRehearsal: { startsAt: new Date(2026, 9, 7, 20, 0) },
      members: { total: 127, pendingInvitations: 2 },
      isSuperAdmin: true,
      unreadReports: 0,
    },
    now,
  );
  assert.deepEqual(
    lines.campaign.map((line) => line.text),
    ["Page masquée", "7 sections prêtes sur 10", "3 témoignages à modérer"],
  );
  assert.equal(lines.campaign[2]!.tone, "warning");
  assert.deepEqual(
    lines.public.map((line) => line.text),
    ["Prochain concert le dimanche 15 novembre"],
  );
  assert.deepEqual(
    lines.season.map((line) => line.text),
    [
      "Drive synchronisé le 03/10/2026 03:31 : 12 nouveaux",
      "Prochaine répétition le mercredi 7 octobre",
    ],
  );
  assert.equal(lines.season[0]!.tone, "success");
  assert.deepEqual(
    lines.members.map((line) => line.text),
    ["127 membres, 2 invitations en cours"],
  );
  assert.deepEqual(
    lines.association.map((line) => line.text),
    ["Aucun signalement non lu"],
  );
}

// A sync that needs attention replaces the "synchronised" line; an admin
// (not superadmin) gets no reports line; empty agendas say so.
{
  const lines = jobStatusLines(
    {
      campaignPublished: true,
      readiness: {
        ready: 10,
        total: 10,
        pendingMemories: 0,
        sectionsToComplete: 0,
        sectionLabels: [],
      },
      nextConcert: null,
      driveSync: { kind: "failed", when: "03/10/2026 03:31", error: null },
      lastDriveSync: { when: "03/10/2026 03:31", counts: {} },
      nextRehearsal: null,
      members: { total: 1, pendingInvitations: 0 },
      isSuperAdmin: false,
      unreadReports: 5,
    },
    now,
  );
  assert.deepEqual(
    lines.campaign.map((line) => line.text),
    ["Page publiée", "10 sections prêtes sur 10"],
  );
  assert.equal(lines.campaign[1]!.tone, "success");
  assert.deepEqual(
    lines.public.map((line) => line.text),
    ["Aucun concert planifié"],
  );
  assert.deepEqual(
    lines.season.map((line) => line.text),
    ["Dernière synchronisation Drive en erreur", "Aucune répétition à venir"],
  );
  assert.equal(lines.season[0]!.tone, "warning");
  assert.deepEqual(
    lines.members.map((line) => line.text),
    ["1 membre"],
  );
  assert.deepEqual(lines.association, []);
}

// No sync ever run yet; unread reports for a superadmin.
{
  const lines = jobStatusLines(
    { lastDriveSync: null, isSuperAdmin: true, unreadReports: 2 },
    now,
  );
  assert.deepEqual(
    lines.season.map((line) => line.text),
    ["Aucune synchronisation Drive pour l'instant"],
  );
  assert.deepEqual(lines.association, [
    { tone: "warning", text: "2 signalements non lus" },
  ]);
}

console.log("utils/home/jobs.test.ts: ok");
