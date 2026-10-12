"use client";
import { membersButtonClass } from "@/components/membres/MembersButton";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { DriveFile } from "@/utils/types";
import { FC, useEffect, useState } from "react";
import { FaFile, FaFolder, FaMusic, FaRegFilePdf } from "react-icons/fa";
import {
  IoArrowBack,
  IoDownloadOutline,
  IoMusicalNotes,
} from "react-icons/io5";
import { toast } from "sonner";

interface ExplorerProps {
  initialFolderId: string;
}

/** Lists a Drive folder, split into sub-folders and files. */
async function loadFolder(folderId: string) {
  const response = await fetch(
    `/api/drive/files?folderID=${encodeURIComponent(folderId)}`,
  );
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Response data is not an array");
  }

  return {
    folders: data.filter((file: { type: string }) => file.type === "folder"),
    files: data.filter((file: { type: string }) => file.type === "file"),
    // Set by the proxy when the listing hit its item cap.
    truncated: response.headers.get("x-drive-truncated") === "true",
  };
}

/** The name the proxy chose (Google Docs gain ".pdf"), from `filename*`. */
function fileNameFromDisposition(header: string | null): string | null {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/**
 * Downloads through the website's proxy (session cookie, scope check): the
 * files aren't publicly shared on Drive. The response is checked first, so an
 * error shows a message instead of being saved as a file named like the score.
 */
async function downloadDriveFile(file: DriveFile) {
  const url = `/api/drive/file?fileId=${encodeURIComponent(file.id ?? "")}&download=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      toast.error(
        response.status === 401
          ? "Votre session a expiré. Reconnectez-vous pour télécharger."
          : response.status === 415
            ? "Ce type de document ne peut pas être téléchargé."
            : "Le téléchargement a échoué. Réessayez plus tard.",
      );
      return;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download =
      fileNameFromDisposition(response.headers.get("content-disposition")) ??
      file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch {
    toast.error("Le téléchargement a échoué. Vérifiez votre connexion.");
  }
}

const Explorer: FC<ExplorerProps> = ({ initialFolderId }) => {
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [individualFiles, setIndividualFiles] = useState<DriveFile[]>([]);
  const [folderStack, setFolderStack] = useState<string[]>([initialFolderId]);
  // The root folder is fetched on mount, so the skeleton shows from the start.
  const [loading, setLoading] = useState(true);

  // Callers set `loading` first; this only clears it once the request ends.
  const fetchData = (folderId: string) =>
    loadFolder(folderId)
      .then(({ folders, files, truncated }) => {
        setFolders(folders);
        setIndividualFiles(files);
        if (truncated) {
          toast.warning(
            "Ce dossier contient trop d'éléments : seuls les premiers sont affichés",
          );
        }
      })
      .catch((error) => {
        console.error("Failed to fetch files:", error);
        toast.error("Erreur lors du chargement des fichiers");
      })
      .finally(() => setLoading(false));

  // A new root folder starts a fresh navigation stack.
  useResetOnChange([initialFolderId], () => {
    setFolderStack([initialFolderId]);
    setLoading(true);
  });

  useEffect(() => {
    fetchData(initialFolderId);
  }, [initialFolderId]);

  const handleFolderClick = (folderId: string) => {
    setFolderStack((prevStack) => [...prevStack, folderId]);
    setLoading(true);
    fetchData(folderId);
  };

  const handleBackClick = () => {
    if (folderStack.length > 1) {
      const newStack = [...folderStack];
      newStack.pop();
      const previousFolderId = newStack[newStack.length - 1];
      setFolderStack(newStack);
      if (previousFolderId) {
        setLoading(true);
        fetchData(previousFolderId);
      }
    }
  };

  const renderFileIcon = (mimeType: string) => {
    switch (mimeType) {
      case "application/pdf":
        return <FaRegFilePdf className="text-red-700 dark:text-red-300" />;
      case "audio/mpeg":
      case "audio/wav":
        return <FaMusic className="text-blue-700 dark:text-blue-300" />;
      case "application/x-musescore":
        return <IoMusicalNotes className="text-primary-text" />;
      default:
        return <FaFile className="text-muted" />;
    }
  };

  const rowClass =
    "border-members-line bg-members-band flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left";

  return (
    <div className="flex flex-col gap-7">
      {/* Navigation */}
      {folderStack.length > 1 && (
        <div>
          <button
            type="button"
            onClick={handleBackClick}
            className={membersButtonClass("outline", "", "md")}
          >
            <IoArrowBack aria-hidden="true" className="h-5 w-5" />
            Retour au dossier précédent
          </button>
        </div>
      )}

      {/* Folders Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold">Dossiers</h3>
        {loading ? (
          <div className="animate-pulse space-y-2" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-primary/10 h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {folders
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((folder) => (
                <button
                  type="button"
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id!)}
                  className={`${rowClass} hover:bg-primary/10 transition-colors`}
                >
                  <FaFolder
                    aria-hidden="true"
                    className="text-primary-text h-5 w-5 shrink-0"
                  />
                  <span className="text-foreground min-w-0 font-medium break-words">
                    {folder.name}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold">Fichiers</h3>
        {loading ? (
          <div className="animate-pulse space-y-2" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-primary/10 h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {individualFiles
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((file) => (
                <div key={file.id} className={`${rowClass} flex-wrap`}>
                  <div aria-hidden="true" className="h-5 w-5 shrink-0">
                    {renderFileIcon(file.mimeType)}
                  </div>
                  <span className="text-foreground min-w-0 flex-[1_1_200px] font-medium break-words">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadDriveFile(file)}
                    aria-label={`Télécharger ${file.name}`}
                    className={membersButtonClass("outlineTeal", "", "md")}
                  >
                    <IoDownloadOutline aria-hidden="true" className="h-5 w-5" />
                    Télécharger
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Empty States */}
      {!loading && folders.length === 0 && individualFiles.length === 0 && (
        <p className="text-muted py-6 text-center">Ce dossier est vide.</p>
      )}
    </div>
  );
};

export default Explorer;
