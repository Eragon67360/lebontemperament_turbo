// A file the browser has just uploaded, whose row the server then failed to
// save: the request may still have gone through, with its answer lost on
// the way back (a reset connection, a gateway timeout). So the file is only
// removed once the server's own list says that no row points at it. When
// that list can't be read, the file stays: an extra object costs nothing,
// a row whose file is gone is a broken download on the website and in the
// app.

/**
 * What became of the upload after the failed save:
 * - `saved`: a row points at it after all, the save is a success;
 * - `orphan`: the server has no row for it, the file was removed;
 * - `unknown`: the server's list couldn't be read, the file stays.
 */
export type FailedSaveOutcome = "saved" | "orphan" | "unknown";

/** The pure decision: `savedKeys` is the server's list read after the failure, null when it couldn't be read. */
export function failedSaveOutcome(
  storageKey: string,
  savedKeys: readonly string[] | null,
): FailedSaveOutcome {
  if (savedKeys === null) return "unknown";
  return savedKeys.includes(storageKey) ? "saved" : "orphan";
}

/**
 * Reads the server's keys again and removes the file only when none is the
 * uploaded one. Never throws: a list that can't be read means `unknown`,
 * and a removal that fails leaves an orphan the way the old code did.
 */
export async function settleFailedSave({
  storageKey,
  readSavedKeys,
  removeFile,
}: {
  storageKey: string;
  readSavedKeys: () => Promise<readonly string[]>;
  removeFile: () => Promise<unknown>;
}): Promise<FailedSaveOutcome> {
  const savedKeys = await readSavedKeys().catch(() => null);
  const outcome = failedSaveOutcome(storageKey, savedKeys);
  if (outcome === "orphan") await removeFile().catch(() => undefined);
  return outcome;
}

/** Added to the error shown when the outcome is `unknown`. */
export const UNSETTLED_SAVE_HINT =
  "Impossible de savoir si le fichier a été enregistré : vérifiez la liste avant de réessayer.";
