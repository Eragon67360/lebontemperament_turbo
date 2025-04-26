"use client";
import { FC, useEffect, useState } from "react";
import {
  FaFile,
  FaFolder,
  FaMusic,
  FaPlus,
  FaRegFilePdf,
} from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";

import { FcFile, FcFolder } from "react-icons/fc";
import { IoArrowBack, IoArrowUndoSharp } from "react-icons/io5";
import { MdModeEdit } from "react-icons/md";
import { SiMusescore } from "react-icons/si";

import { DriveFile } from "@/utils/types";
import { Button, useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import AddElementModal from "../modals/AddElementModal";
import ConfirmationModal from "../modals/ConfirmationModal";
import PasswordModal from "../modals/PasswordModal";

interface ExplorerProps {
  initialFolderId: string;
}

const Explorer: FC<ExplorerProps> = ({ initialFolderId }) => {
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [individualFiles, setIndividualFiles] = useState<DriveFile[]>([]);
  const [folderStack, setFolderStack] = useState<string[]>([initialFolderId]);
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const passwordModal = useDisclosure();
  const addElementModal = useDisclosure();
  const confirmDeleteModal = useDisclosure();

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
    // const audio_test = 'https://drive.google.com/file/d/1H3drFVSXvlGUBEnfmmfTi7rXTZRHujiO/view?usp=sharing'
    const downloadUrl = `${baseFileUrl}&export=download`;

    if (file.mimeType === "application/pdf") {
      window.open(baseFileUrl, "_blank");
    } else if (file.mimeType.startsWith("audio/")) {
      const audioPlayerUrl = `/membres/travail/audioplayer?fileUrl=${encodeURIComponent(audioUrl)}&fileName=${file.name}`;
      window.open(audioPlayerUrl, "_blank");
      // router.push(audioPlayerUrl);
    } else {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddClick = () => {
    addElementModal.onOpen();
  };

  const handleAddElement = async (files: File[]) => {
    try {
      const folderId = folderStack[folderStack.length - 1];
      const fileContents = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          mimeType: file.type,
          content: await fileToBase64(file), // Convert file content to base64 string
          type: file.type === "folder" ? "folder" : "file",
        })),
      );

      const response = await fetch("/api/drive/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId, files: fileContents }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Les fichiers ont bien été ajoutés");
        addElementModal.onClose();
        if (folderId) fetchData(folderId); // Refresh the folder contents
      } else {
        toast.error(
          "Une erreur est survenue lors de l'export! Veuillez contacter Thomas Moser",
        );
        console.error("Error uploading files:", data);
      }
    } catch (error) {
      toast.error(
        "Une erreur est survenue lors de l'export! Veuillez contacter Thomas Moser",
      );
      console.error("Error handling file upload:", error);
    }
  };

  const handleDeleteClick = (file: DriveFile) => {
    setFileToDelete(file);
    confirmDeleteModal.onOpen();
  };

  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      try {
        const response = await fetch(
          `/api/drive/files?fileID=${fileToDelete.id}`,
          {
            method: "DELETE",
          },
        );
        if (response.ok) {
          toast.success("Le fichier a bien été supprimé");
          fetchData(folderStack[folderStack.length - 1] as string); // Refresh the folder contents
        } else {
          toast.error(
            "Une erreur est survenue lors de la suppression! Veuillez contacter Thomas Moser",
          );
          console.error(`Failed to delete file ${fileToDelete.name}`);
        }
      } catch (error) {
        toast.error(
          "Une erreur est survenue lors de la suppression! Veuillez contacter Thomas Moser",
        );
        console.error(`Error deleting file ${fileToDelete.name}:`, error);
      } finally {
        confirmDeleteModal.onClose();
        setFileToDelete(null);
      }
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      toast.success("Vous êtes connecté avec succès!");
      setIsEditMode(true);
      passwordModal.onClose();
    } else {
      toast.error("Le mot de passse est incorrect");
    }
  };

  const renderFileIcon = (mimeType: string) => {
    switch (mimeType) {
      case "application/pdf":
        return <FaRegFilePdf size={24} />;
      case "audio/mpeg":
        return <FaMusic size={24} />;
      case "application/x-musescore":
        return <SiMusescore size={24} />;
      default:
        return <FaFile size={24} />;
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64 as string);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleQuitEditMode = () => {
    setIsEditMode(false);
  };

  const handleEnterEditMode = () => {
    passwordModal.onOpen();
  };

  return (
    <div>
      <div className="flex gap-2 items-center">
        {folderStack.length > 1 && (
          <button
            onClick={handleBackClick}
            className="flex px-4 py-3 border border-black/10 bg-white rounded-lg gap-4 hover:opacity-70 hover:scale-105 cursor-pointer transition-all duration-200"
          >
            <IoArrowBack />
          </button>
        )}
        <FcFolder size={24} />
        <p className="font-semibold text-lg">Dossiers</p>

        {isEditMode && (
          <Button
            className="bg-transparent border border-black/50 rounded-lg hover:opacity-10"
            onClick={handleAddClick}
            startContent={<FaPlus />}
          >
            Importer des fichiers/dossiers
          </Button>
        )}

        {!isEditMode && (
          <Button
            className="bg-transparent border border-black/50 rounded-lg hover:opacity-10"
            onClick={handleEnterEditMode}
            startContent={<MdModeEdit />}
          >
            Éditer le contenu
          </Button>
        )}

        {isEditMode && (
          <Button
            className="bg-transparent border border-black/50 rounded-lg hover:opacity-10"
            onClick={handleQuitEditMode}
            startContent={<IoArrowUndoSharp />}
          >
            Quitter le mode édition
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-4 w-full mt-6">
        {loading ? (
          <p className="font-bold text-lg italic">Recherche en cours...</p>
        ) : (
          <>
            {folders.length === 0 ? (
              <p className="font-bold text-lg italic">
                Pas de dossiers pour le moment !{" "}
              </p>
            ) : (
              <>
                {folders.map((folder) => (
                  <div className="flex gap-2" key={folder.id}>
                    <div
                      onClick={() => handleFolderClick(folder.id!)}
                      className="flex px-4 py-3 border border-black/10 bg-white rounded-lg gap-4 w-full hover:opacity-70 hover:scale-105 cursor-pointer transition-all duration-200"
                    >
                      <FaFolder size={24} />
                      <p>{folder.name}</p>
                    </div>
                    {isEditMode && (
                      <FaRegTrashCan
                        className="text-red-500 cursor-pointer h-full"
                        onClick={() => handleDeleteClick(folder)}
                      />
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="flex gap-1 items-center mt-8">
        <FcFile size={24} />
        <p className="font-semibold text-lg">Fichiers</p>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-4 w-full mt-6">
        {loading ? (
          <p className="font-bold text-lg italic">Recherche en cours...</p>
        ) : (
          <>
            {individualFiles.length === 0 ? (
              <p className="font-bold text-lg italic">
                Pas de fichiers pour le moment !
              </p>
            ) : (
              <>
                {individualFiles.map((file) => (
                  <div className="flex gap-2" key={file.id}>
                    <div
                      onClick={() => handleFileClick(file)}
                      className="flex px-4 py-3 border border-black/10 bg-white rounded-lg gap-4 w-full hover:opacity-70 hover:scale-105 cursor-pointer transition-all duration-200"
                    >
                      {renderFileIcon(file.mimeType)}
                      <p>{file.name}</p>
                    </div>
                    {isEditMode && (
                      <FaRegTrashCan
                        className="text-red-500 cursor-pointer h-full"
                        onClick={() => handleDeleteClick(file)}
                      />
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
      <PasswordModal
        visible={passwordModal.isOpen}
        onPasswordSubmit={handlePasswordSubmit}
        onOpenChange={passwordModal.onOpenChange}
      />
      <AddElementModal
        visible={addElementModal.isOpen}
        onOpenChange={addElementModal.onOpenChange}
        onAdd={handleAddElement}
      />
      <ConfirmationModal
        visible={confirmDeleteModal.isOpen}
        onOpenChange={confirmDeleteModal.onOpenChange}
        onConfirm={handleConfirmDelete}
        message={`Êtes-vous sûr(e) de vouloir supprimer ${fileToDelete?.name}?`}
      />
    </div>
  );
};

export default Explorer;
