// Static renders of the /40-ans galleries and the video overlay (audit
// UI-006): what a screen reader is told, with no DOM. The focus trap and
// Escape live in hooks/useModalDialog.ts and are checked in a browser.
//
// Nothing rendered here may reach `next/image` (a video poster, a gallery
// card): outside Next, tsx imports it as a CJS namespace, not a component.
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import type { Video } from "@/types/anniversary";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import PhotoCollection from "./PhotoCollection";
import VideoGallery from "./VideoGallery";
import { VideoModal } from "./VideoModal";

const video: Video = {
  id: "v1",
  title: "Vidéo v1",
  description: "Texte v1",
  thumbnail_url: "",
  video_url: "https://www.youtube.com/watch?v=abcdefghijk",
  year: 2001,
  category: "Concert",
  display_order: 0,
};

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The filter buttons of a gallery: label and pressed state, in order. */
const filters = (html: string) =>
  Array.from(
    html.matchAll(
      /<button[^>]*aria-pressed="(true|false)"[^>]*>(?:<div[^>]*><\/div>)?([^<]+)<\/button>/g,
    ),
    (match) => `${match[2]}=${match[1]}`,
  );

// --- VideoModal: a modal dialog named after the video, closable by name ---
{
  const html = renderToStaticMarkup(
    <VideoModal video={video} onClose={() => {}} />,
  );
  const dialog = html.match(/<div[^>]*role="dialog"[^>]*>/)?.[0];
  assert.ok(dialog, "the overlay is a dialog");
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /tabindex="-1"/, "the dialog itself can take the focus");
  const labelledBy = dialog.match(/aria-labelledby="([^"]+)"/)?.[1];
  assert.ok(labelledBy, "the dialog is labelled");
  assert.match(
    html,
    new RegExp(`<h3[^>]*id="${escapeRegExp(labelledBy)}"[^>]*>Vidéo v1</h3>`),
    "the label is the video's title",
  );
  assert.match(html, /aria-label="Fermer la vidéo"/);
}

// --- Galleries: the active filter is exposed as pressed ---
{
  const html = renderToStaticMarkup(<PhotoCollection photos={[]} />);
  assert.deepEqual(filters(html), ["Tous=true"]);
  assert.match(html, /<button type="button"[^>]*aria-pressed="true"/);
  // No overlay before a photo is chosen.
  assert.doesNotMatch(html, /role="dialog"/);
}
{
  const settings = {
    contact: {
      email: "contact@example.com",
      street: "1 rue de l'Exemple",
      postalCode: "00000",
      city: "Ville",
    },
    social_links: { links: [] },
  };
  const html = renderToStaticMarkup(
    <SiteSettingsProvider settings={settings}>
      <VideoGallery videos={[]} />
    </SiteSettingsProvider>,
  );
  assert.deepEqual(filters(html), ["Tous=true"]);
  assert.match(html, /<button type="button"[^>]*aria-pressed="true"/);
  assert.doesNotMatch(html, /role="dialog"/);
}

console.log("overlays.test.tsx: ok");
