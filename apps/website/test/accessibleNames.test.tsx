// Run with `npm test -w website` (tsx with tsconfig.test.json, like the other
// tests; no framework). Fake names only: the repository is public.
//
// The accessible names and states audit UI-015 fixed, read from the server
// markup of the real components (test/markup.ts models what a screen reader
// and voice control read). Next's runtime pieces and the hooks that answer
// differently in the browser are replaced by the stubs in test/stubs, wired
// in tsconfig.test.json.
import AnniversaryVideoGallery from "@/components/anniversary/VideoGallery";
import ConcertsClient from "@/components/concerts/ConcertsClient";
import HomeAnnouncements from "@/components/home/HomeAnnouncements";
import HomeContent from "@/components/HomeContent";
import { AuthProvider } from "@/components/providers/AuthProvider";
import {
  SiteSettingsProvider,
  type PublicSiteSettings,
} from "@/components/providers/SiteSettingsProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import type { Announcement } from "@/lib/announcements";
import type { ConcertProject } from "@/types/projects";
import assert from "node:assert/strict";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  accessibleDescription,
  accessibleName,
  allElements,
  controls,
  isExposed,
  isTabbable,
  nameProblems,
  parseHtml,
  visibleText,
  type El,
} from "./markup";
import { setTestTheme } from "./stubs/nextThemes";

const render = (node: ReactElement) => parseHtml(renderToStaticMarkup(node));

const link = (root: El, href: string, text?: string) => {
  const found = allElements(root).filter(
    (el) =>
      el.tag === "a" &&
      el.attrs.href === href &&
      (text === undefined || visibleText(el) === text),
  );
  assert.equal(found.length, 1, `one link to ${href} showing « ${text} »`);
  return found[0]!;
};

// --- The home page ----------------------------------------------------------
{
  // The AG button shows until the AG's day: any day ahead will do.
  const heldAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const home = render(
    <AuthProvider>
      <HomeContent assemblyHeldAt={heldAt} announcements={[]} stories={[]} />
    </AuthProvider>,
  );

  // Every control a screen reader reaches is named, and its name holds the
  // words on screen, so « Cliquer sur Nous contacter » finds it.
  assert.deepEqual(nameProblems(home), []);

  const nameOf = (href: string, text: string) =>
    accessibleName(link(home, href, text), home);
  assert.equal(nameOf("#contact", "Nous contacter"), "Nous contacter");
  assert.equal(
    nameOf("/concerts#histoires", "Toutes les histoires"),
    "Toutes les histoires",
  );
  assert.equal(
    nameOf("/concerts/autres", "Acheter nos CDs"),
    "Acheter nos CDs",
  );
  assert.ok(
    nameOf("/concerts", "Voir tous les concerts").startsWith(
      "Voir tous les concerts",
    ),
  );
  const assembly = allElements(home).find(
    (el) => el.attrs.href === "/ag" && el.tag === "a",
  );
  assert.ok(assembly, "the AG button is shown before the AG");
  assert.ok(
    accessibleName(assembly, home).startsWith("Assemblée Générale –"),
    "the AG button is named by its text, date included",
  );
}

// --- Announcements: the title is the name, the text describes it -------------
{
  const announcement = (over: Partial<Announcement>): Announcement => ({
    id: "11111111-1111-4111-8111-111111111111",
    title: "Concert de test",
    body: null,
    linkLabel: null,
    linkUrl: "/concerts",
    startsOn: null,
    endsOn: null,
    ...over,
  });
  const body = "Un samedi à 20 h, entrée libre, réservations conseillées.";

  const withBody = render(
    <HomeAnnouncements announcements={[announcement({ body })]} />,
  );
  const described = link(withBody, "/concerts");
  assert.equal(accessibleName(described, withBody), "Concert de test");
  assert.equal(accessibleDescription(described, withBody), body);
  assert.deepEqual(nameProblems(withBody), []);
  // The description sits in an element nobody sees or hears twice.
  const target = allElements(withBody).find(
    (el) => el.attrs.id === described.attrs["aria-describedby"],
  );
  assert.ok(target && !isExposed(target));

  const withoutBody = render(
    <HomeAnnouncements
      announcements={[
        announcement({ linkUrl: "https://example.org/inscription" }),
      ]}
    />,
  );
  const plain = link(withoutBody, "https://example.org/inscription");
  assert.equal(accessibleName(plain, withoutBody), "Concert de test");
  assert.equal(accessibleDescription(plain, withoutBody), "");
  assert.equal(plain.attrs["aria-describedby"], undefined);
  assert.equal(plain.attrs.target, "_blank");

  // Two announcements never share a description.
  const two = render(
    <HomeAnnouncements
      announcements={[
        announcement({ body }),
        announcement({
          id: "22222222-2222-4222-8222-222222222222",
          title: "Autre annonce",
          body: "Autre texte",
          linkUrl: "/rejoindre",
        }),
      ]}
    />,
  );
  assert.equal(
    accessibleDescription(link(two, "/rejoindre"), two),
    "Autre texte",
  );
  assert.equal(accessibleDescription(link(two, "/concerts"), two), body);
}

// --- Theme buttons: the one that is on is pressed, not only coloured ---------
{
  const names = [
    "Passer au thème clair",
    "Passer au thème sombre",
    "Utiliser le thème du système",
  ];
  const themes = ["light", "dark", "system"];
  for (const [index, theme] of themes.entries()) {
    setTestTheme(theme);
    const switcher = render(<ThemeSwitcher />);
    const buttons = controls(switcher);
    assert.deepEqual(
      buttons.map((button) => accessibleName(button, switcher)),
      names,
    );
    assert.deepEqual(
      buttons.map((button) => button.attrs["aria-pressed"]),
      themes.map((_, i) => String(i === index)),
      `${theme} is the pressed one`,
    );
  }
  setTestTheme(undefined);
}

// --- /concerts story cards: one Tab stop, the picture link stays out ---------
{
  const story = (over: Partial<ConcertProject>): ConcertProject => ({
    id: "s",
    name: "Histoire fictive",
    date: "2025-06-01",
    slug: "histoire-fictive",
    image: "",
    ...over,
  });
  const concerts = render(
    <ConcertsClient
      initialConcerts={[]}
      initialEvents={[]}
      initialRehearsals={[]}
      initialTours={[]}
      initialProjects={[
        story({
          id: "a",
          name: "Avec bannière",
          slug: "avec-banniere",
          banniere: { url: "/banniere.png" },
        }),
        story({ id: "b", name: "Sans bannière", slug: "sans-banniere" }),
      ]}
    />,
  );
  assert.deepEqual(nameProblems(concerts), []);

  for (const slug of ["avec-banniere", "sans-banniere"]) {
    const toStory = allElements(concerts).filter(
      (el) => el.tag === "a" && el.attrs.href === `/concerts/${slug}`,
    );
    assert.equal(toStory.length, 2, `${slug}: the picture and the text link`);
    const [picture, text] = toStory as [El, El];
    assert.ok(!isExposed(picture), `${slug}: the picture link is hidden`);
    assert.ok(!isTabbable(picture), `${slug}: ...and not a Tab stop`);
    assert.equal(accessibleName(text, concerts), "Lire l’histoire");
    assert.ok(isExposed(text) && isTabbable(text));
  }
}

// --- /40-ans: the YouTube link says where it goes ---------------------------
{
  const settings: PublicSiteSettings = {
    contact: {
      email: "contact@example.org",
      street: "1 rue de l'Exemple",
      postalCode: "00000",
      city: "Ville",
    },
    social_links: {
      links: [{ network: "youtube", url: "https://www.youtube.com/@example" }],
    },
  };
  const gallery = render(
    <SiteSettingsProvider settings={settings}>
      <AnniversaryVideoGallery videos={[]} />
    </SiteSettingsProvider>,
  );
  const youtube = link(gallery, "https://www.youtube.com/@example");
  // « YouTube » is only an icon on screen; the name says where the link goes.
  assert.equal(accessibleName(youtube, gallery), "Voir plus sur YouTube");
  assert.deepEqual(nameProblems(gallery), []);
}

console.log("accessibleNames: ok");
