"use client";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { DriveFile } from "@/utils/types";
import { Button } from "@heroui/react";
import { FC, useEffect, useState } from "react";
import { FaFile, FaFolder, FaMusic, FaRegFilePdf } from "react-icons/fa";
import { IoArrowBack, IoMusicalNotes } from "react-icons/io5";
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
        return <FaRegFilePdf className="text-red-500 dark:text-red-400" />;
      case "audio/mpeg":
      case "audio/wav":
        return <FaMusic className="text-blue-500 dark:text-blue-400" />;
      case "application/x-musescore":
        return (
          <IoMusicalNotes className="text-purple-500 dark:text-purple-400" />
        );
      default:
        return <FaFile className="text-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      {folderStack.length > 1 && (
        <button
          onClick={handleBackClick}
          className="text-muted hover:text-foreground flex items-center gap-2 px-3 py-2 text-sm transition-colors"
        >
          <IoArrowBack className="h-4 w-4" />
          <span>Retour</span>
        </button>
      )}

      {/* Folders Section */}
      <div className="space-y-4">
        <h3 className="text-muted text-sm font-medium">Dossiers</h3>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-secondary h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {folders
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id!)}
                  className="bg-content2 hover:bg-content3 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                >
                  <FaFolder className="h-5 w-5 text-blue-400 dark:text-blue-300" />
                  <span className="text-foreground truncate text-sm font-medium">
                    {folder.name}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="space-y-4">
        <h3 className="text-muted text-sm font-medium">Fichiers</h3>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-secondary h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {individualFiles
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((file) => (
                <div
                  key={file.id}
                  className="group bg-content2 hover:bg-content3 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="h-5 w-5">{renderFileIcon(file.mimeType)}</div>
                  <span className="text-foreground flex-1 truncate text-sm font-medium">
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => downloadDriveFile(file)}
                    className="cursor-pointer"
                  >
                    Télécharger
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Empty States */}
      {!loading && folders.length === 0 && individualFiles.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted text-sm">Ce dossier est vide</p>
        </div>
      )}
    </div>
  );
};

export default Explorer;
