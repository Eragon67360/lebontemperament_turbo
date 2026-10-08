// Static renders of the home's presentational pieces (no DOM, no queries):
// what the admin reads, where the links go, which button is the primary.
import { buildHomeTasks } from "@/utils/home/tasks";
import { mergeUpcoming } from "@/utils/home/upcoming";
import { Cake, CalendarOff } from "lucide-react";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { firstNameOf } from "../DashboardWelcomeUser";
import { DateBlock } from "../ui/date-block";
import { describeLeft } from "./CampaignSection";
import { JobCard } from "./JobCard";
import { NextConcertCard, posterOf } from "./NextConcertSection";
import { TaskRows } from "./TaskRows";
import { UpcomingRows } from "./UpcomingRows";

const now = new Date(2026, 9, 3, 10, 0, 0);

// --- Welcome header helpers ---
assert.equal(firstNameOf("Camille Martin"), "Camille");
assert.equal(firstNameOf("  Jean-Pierre  Dupont "), "Jean-Pierre");
assert.equal(firstNameOf(null), "");
assert.equal(firstNameOf(""), "");

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
  // Programme-style date blocks: day, month abbreviation, a right rule
  // (teal for the concert only), hidden from screen readers.
  assert.equal((html.match(/data-slot="date-block"/g) ?? []).length, 2);
  assert.match(html, />7<\/span><span[^>]*>oct\.<\/span>/);
  assert.match(html, />25<\/span><span[^>]*>oct\.<\/span>/);
  assert.equal((html.match(/border-primary(?=[\s"])/g) ?? []).length, 1);
  assert.equal((html.match(/border-border-strong/g) ?? []).length, 1);
  assert.ok(
    html.indexOf("border-border-strong") < html.indexOf("border-primary"),
    "the rehearsal (first row) is neutral, the concert teal",
  );
  assert.match(html, /href="\/dashboard\/members\/repetitions"/);
  assert.match(
    html,
    /href="\/dashboard\/public\/concerts\/prochains-concerts"/,
  );
  assert.match(html, />Répétition<\/div>/);
  assert.match(html, />Concert<\/div>/);
}

// --- DateBlock: the two sizes ---
{
  const sm = renderToStaticMarkup(
    createElement(DateBlock, { date: new Date(2026, 10, 15) }),
  );
  assert.match(sm, /aria-hidden="true"/);
  assert.match(sm, /text-\[20px\]/);
  assert.match(sm, /text-\[11px\]/);
  assert.match(sm, />15<\/span>/);
  assert.match(sm, />nov\.<\/span>/);
  assert.match(sm, /border-r-2 [^"]*border-border-strong/);

  const lg = renderToStaticMarkup(
    createElement(DateBlock, {
      date: new Date(2026, 10, 15),
      size: "lg",
      tone: "primary",
    }),
  );
  assert.match(lg, /text-\[44px\]/);
  assert.match(lg, /text-\[14px\]/);
  assert.match(lg, /border-r-2 [^"]*border-primary(?=[\s"])/);
}

// --- DateBlock without a date: the icon keeps the footprint ---
{
  const html = renderToStaticMarkup(
    createElement(DateBlock, { date: null, icon: CalendarOff }),
  );
  assert.match(html, /data-slot="date-block"/);
  assert.match(html, /<svg/);
  assert.doesNotMatch(html, /tabular-nums/);
}

// --- NextConcertCard: poster, programme block, title, meta, two actions ---
{
  const concert = {
    id: "c1",
    name: "Entre terre et ciel",
    date: "2026-11-15",
    time: "20:30:00",
    place: "Église Saint-Paul",
    context: "orchestre_et_choeur",
    affiche:
      "https://example.supabase.co/storage/v1/object/public/affiches/a.jpg",
    is_free: true,
    price: null,
  };

  // The poster is the site's own `affiche` (next/image does not render under
  // the test runner, so the card is rendered without one below).
  assert.deepEqual(posterOf(concert), {
    src: concert.affiche,
    alt: "Affiche de Entre terre et ciel",
  });
  assert.equal(posterOf({ ...concert, affiche: null }), null);

  const html = renderToStaticMarkup(
    createElement(NextConcertCard, {
      concert: { ...concert, affiche: null },
      now,
    }),
  );

  assert.match(html, />Prochain concert</);
  assert.match(html, /<h2[^>]*>Entre terre et ciel<\/h2>/);
  assert.match(html, />15<\/span><span[^>]*>nov\.<\/span>/);
  assert.match(html, /border-r-2 [^"]*border-primary(?=[\s"])/);
  assert.match(html, /Dimanche 15 novembre · 20 h 30 · Église Saint-Paul/);
  assert.match(html, /Orchestre et chœur · Entrée libre/);
  assert.match(
    html,
    /href="\/dashboard\/public\/concerts\/prochains-concerts"[^>]*>.*Modifier le concert/,
  );
  assert.match(html, /href="[^"]*\/concerts" target="_blank"/);
  assert.match(html, /Voir sur le site/);
  // Both actions are secondary: the home's one primary is in « À faire ».
  assert.doesNotMatch(html, /bg-primary-strong/);
  // No poster: a muted block with a music icon, no broken image.
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /lucide-music/);

  // No name: the site's title; « Autre » and no known entry add nothing.
  const bare = renderToStaticMarkup(
    createElement(NextConcertCard, {
      concert: {
        ...concert,
        affiche: null,
        name: null,
        context: "autre",
        is_free: null,
      },
      now,
    }),
  );
  assert.match(bare, /<h2[^>]*>Concert à Église Saint-Paul<\/h2>/);
  assert.equal((bare.match(/<p /g) ?? []).length, 2);
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

// --- Campaign card: « tout est prêt » only when it is ---
{
  const base = {
    ready: 10,
    total: 10,
    pendingMemories: 0,
    sectionsToComplete: 0,
    sectionLabels: [] as string[],
  };
  assert.equal(describeLeft(base), "Toutes les sections sont prêtes.");
  assert.equal(
    describeLeft({
      ...base,
      ready: 8,
      sectionsToComplete: 2,
      sectionLabels: ["Chronologie", "Souvenirs audio"],
    }),
    "À compléter : Chronologie, Souvenirs audio.",
  );
  // Only moderation left: the sections are not "all ready", and it is said.
  assert.equal(
    describeLeft({ ...base, ready: 9, pendingMemories: 3 }),
    "3 témoignages attendent votre avis.",
  );
  assert.equal(
    describeLeft({
      ...base,
      ready: 8,
      sectionsToComplete: 1,
      sectionLabels: ["Photos"],
      pendingMemories: 1,
    }),
    "À compléter : Photos. 1 témoignage attend votre avis.",
  );
}

console.log("components/home/home.test.ts: ok");
