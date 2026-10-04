// Static renders of the home's presentational pieces (no DOM, no queries):
// what the admin reads, where the links go, which button is the primary.
import { buildHomeTasks } from "@/utils/home/tasks";
import { mergeUpcoming } from "@/utils/home/upcoming";
import { Cake } from "lucide-react";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { firstNameOf, formatTodayFr } from "../DashboardWelcomeUser";
import { JobCard } from "./JobCard";
import { TaskRows } from "./TaskRows";
import { UpcomingRows } from "./UpcomingRows";

const now = new Date(2026, 9, 3, 10, 0, 0);

// --- Welcome header helpers ---
assert.equal(firstNameOf("Camille Martin"), "Camille");
assert.equal(firstNameOf("  Jean-Pierre  Dupont "), "Jean-Pierre");
assert.equal(firstNameOf(null), "");
assert.equal(firstNameOf(""), "");
assert.equal(formatTodayFr(now), "Samedi 3 octobre 2026");

// --- TaskRows: first action filled, the others outlined; links and the dialog button ---
{
  const tasks = buildHomeTasks({
    memoriesPending: 3,
    unreadMessages: 2,
    sectionsToComplete: 1,
  });
  const html = renderToStaticMarkup(createElement(TaskRows, { tasks }));

  assert.match(html, /3 témoignages attendent votre avis/);
  assert.match(html, /2 messages non lus/);
  assert.match(html, /1 section de la page des 40 ans à compléter/);

  // One <ol> of three rows, each with an h3.
  assert.equal((html.match(/<li/g) ?? []).length, 3);
  assert.equal((html.match(/<h3/g) ?? []).length, 3);

  // The first row's action is the one filled teal button of the section
  // (`hover:bg-primary-strong-hover` is the same button, not a second one).
  const filled = html.match(/bg-primary-strong(?=[\s"])/g) ?? [];
  assert.equal(filled.length, 1);
  assert.ok(
    html.indexOf("bg-primary-strong") < html.indexOf("2 messages non lus"),
    "the filled button belongs to the first row",
  );

  // Links go to real routes; the messages task is a button, not a link.
  assert.match(html, /href="\/dashboard\/admin\/anniversary\/memories"/);
  assert.match(html, /href="\/dashboard\/admin\/anniversary"/);
  assert.match(html, /<button[^>]*>Lire/);
  assert.equal((html.match(/<a /g) ?? []).length, 2);
}

// --- UpcomingRows: date block, wording, chip, link per kind ---
{
  const items = mergeUpcoming(
    {
      rehearsals: [
        {
          id: "r1",
          name: "Répétition Adultes",
          date: "2026-10-07",
          start_time: "20:00:00",
          end_time: "22:00:00",
          place: "Salle Saint-Thomas",
        },
      ],
      concerts: [
        {
          id: "c1",
          name: "Entre terre et ciel",
          date: "2026-10-25",
          time: "20:30:00",
          place: "Église Saint-Paul",
        },
      ],
    },
    { now },
  );
  const html = renderToStaticMarkup(
    createElement(UpcomingRows, { items, now }),
  );

  assert.match(html, /Répétition Adultes/);
  assert.match(html, /Mercredi 7 octobre, 20 h · Salle Saint-Thomas/);
  assert.match(html, /Dimanche 25 octobre, 20 h 30 · Église Saint-Paul/);
  assert.match(html, />7<\/b>/);
  assert.match(html, />25<\/b>/);
  assert.match(html, /href="\/dashboard\/members\/repetitions"/);
  assert.match(
    html,
    /href="\/dashboard\/public\/concerts\/prochains-concerts"/,
  );
  assert.match(html, />Répétition<\/div>/);
  assert.match(html, />Concert<\/div>/);
}

// --- JobCard: description, status lines, links ---
{
  const html = renderToStaticMarkup(
    createElement(JobCard, {
      id: "campaign",
      label: "Campagne 40 ans",
      description: "Préparer et publier la page des 40 ans",
      icon: Cake,
      lines: [
        { tone: "neutral", text: "7 sections prêtes sur 10" },
        { tone: "warning", text: "3 témoignages à modérer" },
      ],
      links: [
        {
          label: "Vue d’ensemble et publication",
          href: "/dashboard/admin/anniversary",
        },
        { label: "Modération", href: "/dashboard/admin/anniversary/memories" },
      ],
    }),
  );
  assert.match(html, /<h3[^>]*>Campagne 40 ans<\/h3>/);
  assert.match(html, /Préparer et publier la page des 40 ans\./);
  assert.match(html, /7 sections prêtes sur 10/);
  assert.match(html, /3 témoignages à modérer/);
  assert.match(html, /text-warning/);
  assert.equal((html.match(/<a /g) ?? []).length, 2);
  // No filled button in a job card: the primary belongs to « À faire ».
  assert.doesNotMatch(html, /bg-primary-strong/);
}

console.log("components/home/home.test.ts: ok");
