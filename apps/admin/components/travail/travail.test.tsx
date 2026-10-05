// Static renders of « Partitions et documents »' presentational pieces (no
// DOM, no queries): the folder and document rows, the index's freshness
// line and the old Storage programmes.
import type { DriveIndexNode } from "@/utils/drive/tree";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DocumentRow,
  DriveSyncStatusLine,
  FolderRow,
  IndexList,
} from "./DriveIndexRows";
import { LegacyStorageSection } from "./LegacyStorageSection";

const folder: DriveIndexNode = {
  drive_id: "1AbCdEfGhIjKlMnOp",
  parent_drive_id: "1Root000000000",
  root_slug: "adultes",
  kind: "folder",
  name: "Requiem de Fauré",
  mime_type: "application/vnd.google-apps.folder",
  size: null,
  modified_time: null,
  depth: 1,
};

const file: DriveIndexNode = {
  ...folder,
  drive_id: "1FiLe0000000000",
  kind: "file",
  name: "Sanctus - sopranes.pdf",
  mime_type: "application/pdf",
  size: 1536 * 1024,
  modified_time: "2026-09-12T08:00:00Z",
  depth: 3,
};

const render = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(<IndexList label="Liste">{element}</IndexList>);

// --- A programme: link to the next level, contents, Drive link with an accessible name ---
{
  const html = render(
    createElement(FolderRow, {
      node: folder,
      href: "/dashboard/members/travail/1AbCdEfGhIjKlMnOp",
      stats: {
        folders: 4,
        documents: 23,
        lastModified: "2026-09-12T08:00:00Z",
      },
    }),
  );
  assert.match(html, /<ul aria-label="Liste"/);
  assert.match(html, /href="\/dashboard\/members\/travail\/1AbCdEfGhIjKlMnOp"/);
  assert.match(html, /Requiem de Fauré/);
  assert.match(
    html,
    /4 dossiers · 23 documents · dernier document modifié le 12 sept\. 2026/,
  );
  assert.match(
    html,
    /href="https:\/\/drive\.google\.com\/drive\/folders\/1AbCdEfGhIjKlMnOp" target="_blank" rel="noopener noreferrer"/,
  );
  assert.match(
    html,
    /Ouvrir dans Drive<span class="sr-only"> : Requiem de Fauré \(nouvel onglet\)/,
  );
}

// --- An empty folder says so, without a date ---
{
  const html = render(
    createElement(FolderRow, {
      node: folder,
      href: "/x",
      stats: { folders: 0, documents: 0, lastModified: null },
    }),
  );
  assert.match(html, />Vide</);
  assert.doesNotMatch(html, /modifié le/);
}

// --- A document: type, French size, Paris date, file link ---
{
  const html = render(createElement(DocumentRow, { node: file }));
  assert.match(html, /Sanctus - sopranes\.pdf/);
  assert.match(html, /PDF · 1,5 Mo · modifié le 12 sept\. 2026/);
  assert.match(
    html,
    /href="https:\/\/drive\.google\.com\/file\/d\/1FiLe0000000000\/view"/,
  );
}

// --- A Google Doc has no size: the fact is left out, not « null » ---
{
  const html = render(
    createElement(DocumentRow, {
      node: {
        ...file,
        name: "Planning",
        mime_type: "application/vnd.google-apps.document",
        size: null,
        modified_time: null,
      },
    }),
  );
  assert.match(html, />Document Google</);
  assert.doesNotMatch(html, /null|undefined|modifié le/);
}

// --- Freshness line: word + sentence + last good date ---
{
  const html = renderToStaticMarkup(
    createElement(DriveSyncStatusLine, {
      status: {
        tone: "danger",
        label: "La dernière mise à jour de l'index a échoué.",
        appliedAt: "2026-10-02T01:31:00Z",
      },
    }),
  );
  assert.match(html, /Échec/);
  assert.match(html, /a échoué\./);
  assert.match(
    html,
    /Dernière mise à jour réussie : <span[^>]*>02\/10\/2026 03:31<\/span>/,
  );

  const never = renderToStaticMarkup(
    createElement(DriveSyncStatusLine, {
      status: { tone: "info", label: "Rien.", appliedAt: null },
    }),
  );
  assert.match(never, /Jamais synchronisé/);
  assert.doesNotMatch(never, /Dernière mise à jour réussie/);
}

// --- Old Storage programmes: links by UUID, failure and empty states ---
{
  const html = renderToStaticMarkup(
    createElement(LegacyStorageSection, {
      programs: [
        {
          id: "6f1c2a54-3b1d-4f8e-9a77-0c2d5e8b9f10",
          name: "Saison 2024-2025",
          start_date: "2024-09-01",
          end_date: "2025-06-30",
          is_active: true,
        },
      ],
      failed: false,
    }),
  );
  assert.match(html, /jamais vus/);
  assert.match(
    html,
    /href="\/dashboard\/members\/travail\/6f1c2a54-3b1d-4f8e-9a77-0c2d5e8b9f10"/,
  );
  assert.match(html, /septembre 2024 – juin 2025/);
  assert.match(html, /En cours/);

  assert.match(
    renderToStaticMarkup(
      createElement(LegacyStorageSection, { programs: [], failed: true }),
    ),
    /role="alert"[^>]*>Les anciens programmes n(&#x27;|')ont pas pu être chargés/,
  );
  assert.match(
    renderToStaticMarkup(
      createElement(LegacyStorageSection, { programs: [], failed: false }),
    ),
    /Aucun ancien programme\./,
  );
}

console.log("components/travail/travail.test.tsx: ok");
