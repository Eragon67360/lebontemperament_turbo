// Static render of a gallery video row: the thumbnail is YouTube's own
// image, lazy, inside a link to YouTube in a new tab; no iframe.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VideoRow } from "./VideoRow";

const reorder = {
  canMoveUp: false,
  canMoveDown: true,
  onMoveUp: () => {},
  onMoveDown: () => {},
};

const video = {
  id: "v1",
  created_at: "",
  updated_at: "",
  title: "Requiem",
  composer: "Fauré",
  youtube_url: "https://youtu.be/dQw4w9WgXcQ",
  performance_date: "2025-06-01",
  venue: "Église Saint-Test",
  soloists: ["Prénom Un"],
  created_by: "",
  is_active: true,
};

const render = (v: typeof video) =>
  renderToStaticMarkup(
    createElement(VideoRow, {
      video: v,
      reorder,
      busy: false,
      onEdit: () => {},
      onDelete: () => {},
    }),
  );

{
  const html = render(video);
  assert.match(
    html,
    /<img[^>]*src="https:\/\/i\.ytimg\.com\/vi\/dQw4w9WgXcQ\/hqdefault\.jpg"/,
  );
  assert.match(html, /<img[^>]*loading="lazy"/);
  assert.doesNotMatch(html, /<iframe/);
  // Play and « Voir sur YouTube » both open the watch page in a new tab.
  const links = html.match(
    /href="https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ"[^>]*target="_blank"/g,
  );
  assert.equal(links?.length, 2);
  assert.match(html, /Regarder « Requiem » sur YouTube \(nouvel onglet\)/);
  assert.match(html, /Voir sur YouTube/);
  // The facts, and no visibility badge (videos have none).
  assert.match(html, /Fauré/);
  assert.match(html, /1 juin 2025/);
  assert.match(html, /Église Saint-Test/);
  assert.match(html, /Prénom Un/);
  assert.doesNotMatch(html, />Visible</);
  // The row's actions name the video.
  assert.match(html, /Modifier<span class="sr-only"> « Requiem »/);
  assert.match(html, /Supprimer<span class="sr-only"> « Requiem »/);
}

// --- An unreadable link is said, not hidden ---
{
  const html = render({ ...video, youtube_url: "https://vimeo.com/1" });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /Lien YouTube illisible/);
  assert.doesNotMatch(html, /Voir sur YouTube/);
}

console.log("videos components: all assertions passed");
