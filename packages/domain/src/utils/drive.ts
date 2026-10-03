/** Row of drive_folders that is the "Accès direct au drive" link, not a tab. */
export const DRIVE_ROOT_SLUG = "racine";

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
