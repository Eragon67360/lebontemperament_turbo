"use client";
import { FC, useEffect, useState } from "react";
import { FaFile, FaFolder, FaMusic, FaRegFilePdf } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { SiMusescore } from "react-icons/si";
import { DriveFile } from "@/utils/types";
import { toast } from "sonner";
import { Button } from "@heroui/react";

interface ExplorerProps {
  initialFolderId: string;
}

const Explorer: FC<ExplorerProps> = ({ initialFolderId }) => {
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [individualFiles, setIndividualFiles] = useState<DriveFile[]>([]);
  const [folderStack, setFolderStack] = useState<string[]>([initialFolderId]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (folderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/drive/files?folderID=${folderId}`);
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Response data is not an array");
      }

      const fetchedFolders = data.filter(
        (file: { type: string }) => file.type === "folder",
      );
      const fetchedFiles = data.filter(
        (file: { type: string }) => file.type === "file",
      );

      setFolders(fetchedFolders);
      setIndividualFiles(fetchedFiles);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      toast.error("Erreur lors du chargement des fichiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFolderStack([initialFolderId]);
    fetchData(initialFolderId);
  }, [initialFolderId]);

  const handleFolderClick = (folderId: string) => {
    setFolderStack((prevStack) => [...prevStack, folderId]);
    fetchData(folderId);
  };

  const handleBackClick = () => {
    if (folderStack.length > 1) {
      const newStack = [...folderStack];
      newStack.pop();
      const previousFolderId = newStack[newStack.length - 1];
      setFolderStack(newStack);
      if (previousFolderId) fetchData(previousFolderId);
    }
  };

  const renderFileIcon = (mimeType: string) => {
    switch (mimeType) {
      case "application/pdf":
        return <FaRegFilePdf className="text-red-500" />;
      case "audio/mpeg":
      case "audio/wav":
        return <FaMusic className="text-blue-500" />;
      case "application/x-musescore":
        return <SiMusescore className="text-purple-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      {folderStack.length > 1 && (
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
        >
          <IoArrowBack className="h-4 w-4" />
          <span>Retour</span>
        </button>
      )}

      {/* Folders Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500">Dossiers</h3>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id!)}
                className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left transition-colors hover:bg-gray-50"
              >
                <FaFolder className="h-5 w-5 text-blue-400" />
                <span className="truncate text-sm font-medium text-gray-900">
                  {folder.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500">Fichiers</h3>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {individualFiles.map((file) => (
              <div
                key={file.id}
                className="group flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="h-5 w-5">{renderFileIcon(file.mimeType)}</div>
                <span className="flex-1 truncate text-sm font-medium text-gray-900">
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    const downloadUrl = `https://drive.google.com/uc?id=${file.id}&export=download`;
                    const link = document.createElement("a");
                    link.href = downloadUrl;
                    link.download = file.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="cursor-pointer rounded-lg bg-blue-500 px-3 py-1 text-sm text-black transition-colors hover:bg-blue-600"
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
          <p className="text-sm text-gray-500">Ce dossier est vide</p>
        </div>
      )}
    </div>
  );
};

export default Explorer;
