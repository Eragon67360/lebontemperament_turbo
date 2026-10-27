import { slugify } from "./slug";

/**
 * Row of drive_folders that is the whole Drive, not a tab. The admin does not
 * show it (nobody edits it); the Drive sync still walks it.
 */
export const DRIVE_ROOT_SLUG = "racine";

/**
 * Slugs the website or the app rely on by name: `scoreFolderFor` sends a
 * member to adultes, jeunes or orchestre, and the tab icons are keyed by slug.
 * Renaming one of these folders changes its label only.
 */
export const DRIVE_FIXED_SLUGS: readonly string[] = [
  DRIVE_ROOT_SLUG,
  "adultes",
  "jeunes",
  "enfants",
  "orchestre",
];

/** The longest folder name the admin accepts. */
export const DRIVE_LABEL_MAX_LENGTH = 60;

const BARE_ID = /^[A-Za-z0-9_-]{10,}$/;

/**
 * Normalizes what an admin pastes into a Drive folder field: either a bare
 * folder ID or any of the URLs Drive hands out (share link, /file/d/, open?id=).
 * Returns "" when nothing usable is found, so callers can reject instead of
 * storing an ID that silently breaks the members area.
 */
export const extractDriveFolderId = (input: string): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  const value = input.trim();
  if (BARE_ID.test(value)) {
    return value;
  }

  const fromPath = value.match(/\/(?:folders|d)\/([A-Za-z0-9_-]{10,})/);
  if (fromPath?.[1]) {
    return fromPath[1];
  }

  const fromQuery = value.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return fromQuery?.[1] ?? "";
};

export const driveFolderUrl = (folderId: string): string =>
  `https://drive.google.com/drive/folders/${folderId}`;

/**
 * The slug a folder name gives: « Cahier 40 ans » → "cahier-40-ans". Accents
 * and ligatures are folded, anything else becomes a dash. "" when the name has
 * no letter or digit.
 */
export const slugifyDriveLabel = (label: string): string =>
  slugify(typeof label === "string" ? label : "", DRIVE_LABEL_MAX_LENGTH);

export interface DriveFolderRef {
  id: string;
  slug: string;
  label: string;
  folder_id: string;
}

export type DriveFolderPatchPlan =
  | {
      ok: true;
      /** Columns to write; empty when nothing changes. */
      patch: { label?: string; slug?: string; folder_id?: string };
      slugChanged: boolean;
      folderChanged: boolean;
    }
  | { ok: false; error: string };

/**
 * What an admin's edit of one drive_folders row does: validates the new name
 * and Drive folder, derives the new slug from the name (unless the code relies
 * on the current slug), and refuses names or folders another row already uses.
 * `others` are all the other rows, the Drive root included.
 */
export const planDriveFolderUpdate = (
  current: DriveFolderRef,
  others: readonly DriveFolderRef[],
  input: { label?: unknown; folder_id?: unknown },
): DriveFolderPatchPlan => {
  if (current.slug === DRIVE_ROOT_SLUG) {
    return { ok: false, error: "Ce dossier n'est pas modifiable." };
  }

  const patch: { label?: string; slug?: string; folder_id?: string } = {};
  let slugChanged = false;
  let folderChanged = false;

  if (input.label !== undefined) {
    if (typeof input.label !== "string" || !input.label.trim()) {
      return { ok: false, error: "Le nom du dossier est requis." };
    }
    const label = input.label.trim().replace(/\s+/g, " ");
    if (label.length > DRIVE_LABEL_MAX_LENGTH) {
      return {
        ok: false,
        error: `Le nom est trop long (${DRIVE_LABEL_MAX_LENGTH} caractères au plus).`,
      };
    }

    if (label !== current.label) {
      patch.label = label;

      if (!DRIVE_FIXED_SLUGS.includes(current.slug)) {
        const slug = slugifyDriveLabel(label);
        if (!slug) {
          return {
            ok: false,
            error: "Le nom doit contenir au moins une lettre ou un chiffre.",
          };
        }
        const taken =
          DRIVE_FIXED_SLUGS.includes(slug) ||
          others.some((other) => other.slug === slug);
        if (taken) {
          return {
            ok: false,
            error: "Un autre dossier porte déjà ce nom.",
          };
        }
        if (slug !== current.slug) {
          patch.slug = slug;
          slugChanged = true;
        }
      }
    }
  }

  if (input.folder_id !== undefined) {
    if (typeof input.folder_id !== "string") {
      return { ok: false, error: "Identifiant de dossier Drive invalide" };
    }
    const folderId = extractDriveFolderId(input.folder_id);
    if (!folderId) {
      return { ok: false, error: "Identifiant de dossier Drive invalide" };
    }
    if (folderId !== current.folder_id) {
      if (others.some((other) => other.folder_id === folderId)) {
        return {
          ok: false,
          error: "Ce dossier Drive est déjà utilisé par un autre dossier.",
        };
      }
      patch.folder_id = folderId;
      folderChanged = true;
    }
  }

  return { ok: true, patch, slugChanged, folderChanged };
};
