"use client";
import { FC, useEffect, useState } from "react";
import { FaFile, FaFolder, FaMusic, FaRegFilePdf } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { SiMusescore } from "react-icons/si";
import { DriveFile } from "@/utils/types";
import { toast } from "sonner";

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

  const handleFileClick = (file: DriveFile) => {
    const baseFileUrl = `https://drive.google.com/uc?id=${file.id}`;
    const audioUrl = `https://drive.google.com/file/d/${file.id}/preview`;
    const downloadUrl = `${baseFileUrl}&export=download`;

    if (file.mimeType === "application/pdf") {
      window.open(baseFileUrl, "_blank");
    } else if (file.mimeType.startsWith("audio/")) {
      const audioPlayerUrl = `/membres/travail/audioplayer?fileUrl=${encodeURIComponent(
        audioUrl,
      )}&fileName=${file.name}`;
      window.open(audioPlayerUrl, "_blank");
    } else {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderFileIcon = (mimeType: string) => {
    switch (mimeType) {
      case "application/pdf":
        return <FaRegFilePdf className="text-red-500" />;
      case "audio/mpeg":
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
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <IoArrowBack className="w-4 h-4" />
          <span>Retour</span>
        </button>
      )}

      {/* Folders Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500">Dossiers</h3>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id!)}
                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
              >
                <FaFolder className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-gray-900 truncate">
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
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {individualFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left w-full group"
              >
                <div className="w-5 h-5">{renderFileIcon(file.mimeType)}</div>
                <span className="text-sm font-medium text-gray-900 truncate flex-1">
                  {file.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty States */}
      {!loading && folders.length === 0 && individualFiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Ce dossier est vide</p>
        </div>
      )}
    </div>
  );
};

export default Explorer;
