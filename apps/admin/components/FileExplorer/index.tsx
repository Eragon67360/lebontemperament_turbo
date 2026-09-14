// components/FileExplorer/index.tsx
"use client";

import { Button } from "@/components/ui/button";
import { DataState, ListSkeleton } from "@/components/ui/data-state";
import { FileRecord, Folder } from "@/types/files";
import { createClient } from "@/utils/supabase/client";
import { FolderPlus, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { FileList } from "./FileList";
import { UploadFileDialog } from "./UploadFileDialog";

interface FileExplorerProps {
  programId: string;
  groupId: string;
}

export function FileExplorer({ programId, groupId }: FileExplorerProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<
    (Folder | FileRecord) | null
  >(null);

  const handleDeleteRequest = (item: Folder | FileRecord) => {
    setItemToDelete(item);
  };

  const loadContent = useCallback(
    async (folderId?: string) => {
      setLoading(true);
      setFailed(false);
      try {
        const foldersRes = await fetch(
          `/api/folders?programId=${programId}&groupId=${groupId}`,
        );
        const foldersData = await foldersRes.json();

        const filesRes = await fetch(
          `/api/files?programId=${programId}&groupId=${groupId}${
            folderId ? `&folderId=${folderId}` : ""
          }`,
        );
        const filesData = await filesRes.json();

        setFolders(foldersData);
        setFiles(filesData);
      } catch (error) {
        // A failed load used to leave an empty explorer behind, which reads as
        // "this folder is empty" rather than "this did not load".
        setFailed(true);
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [programId, groupId],
  ); // Dependencies for useCallback

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleCreateFolder = async (name: string) => {
    toast.promise(
      async () => {
        const response = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            program_id: programId,
            group_id: groupId,
            parent_folder_id: currentFolder?.id,
          }),
        });

        if (!response.ok) throw new Error();

        await loadContent(currentFolder?.id);
        setIsCreateFolderOpen(false);
      },
      {
        loading: "Création du dossier...",
        success: "Dossier créé avec succès",
        error: "Impossible de créer le dossier",
      },
    );
  };

  const handleFileUpload = async (file: File) => {
    toast.promise(
      async () => {
        const supabase = createClient();

        const path = `${programId}/${groupId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("programs") // bucket name
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const response = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            original_name: file.name,
            size: file.size,
            mime_type: file.type,
            storage_path: path,
            program_id: programId,
            group_id: groupId,
            folder_id: currentFolder?.id,
          }),
        });

        if (!response.ok) throw new Error();

        await loadContent(currentFolder?.id);
        setIsUploadFileOpen(false);
      },
      {
        loading: "Téléversement en cours...",
        success: "Fichier téléversé avec succès",
        error: "Impossible de téléverser le fichier",
      },
    );
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const isFolder = "parent_folder_id" in itemToDelete;
    const itemType = isFolder ? "dossier" : "fichier";

    toast.promise(
      async () => {
        const response = await fetch(
          `/api/${isFolder ? "folders" : "files"}/${itemToDelete.id}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || `Impossible de supprimer le ${itemType}`,
          );
        }

        await loadContent(currentFolder?.id);
        setItemToDelete(null); // Close the dialog
      },
      {
        loading: `Suppression du ${itemType}...`,
        success: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} supprimé avec succès`,
        error: (error) =>
          error.message || `Impossible de supprimer le ${itemType}`,
      },
    );
  };

  const currentFolders = folders.filter((f) => {
    if (currentFolder === null) {
      // At root level, show folders with no parent
      return f.parent_folder_id === null;
    }
    // Inside a folder, show its children
    return f.parent_folder_id === currentFolder.id;
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="w-full overflow-x-auto sm:w-auto">
          <BreadcrumbNav
            currentFolder={currentFolder}
            onNavigate={(folder) => {
              setCurrentFolder(folder);
              loadContent(folder?.id);
            }}
          />
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            onClick={() => setIsCreateFolderOpen(true)}
            variant="outline"
            className="min-h-11 flex-1 sm:flex-none"
          >
            <FolderPlus className="mr-2 h-4 w-4" aria-hidden />
            <span className="whitespace-nowrap">Nouveau dossier</span>
          </Button>

          <Button
            onClick={() => setIsUploadFileOpen(true)}
            className="min-h-11 flex-1 sm:flex-none"
          >
            <Upload className="mr-2 h-4 w-4" aria-hidden />
            <span className="whitespace-nowrap">Ajouter</span>
          </Button>
        </div>
      </div>

      <DataState
        isLoading={loading}
        isError={failed}
        onRetry={() => loadContent(currentFolder?.id)}
        errorDescription="Le contenu de ce dossier n'a pas pu être chargé."
        skeleton={
          <ListSkeleton
            rows={4}
            label="Chargement des documents…"
            className="border-border rounded-lg border p-4"
          />
        }
      >
        <div className="border-border rounded-lg border p-2 sm:p-4">
          <FileList
            folders={currentFolders}
            files={files}
            onFolderClick={(folder) => {
              setCurrentFolder(folder);
              loadContent(folder.id);
            }}
            onDelete={handleDeleteRequest}
          />
        </div>
      </DataState>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onSubmit={handleCreateFolder}
      />

      <UploadFileDialog
        open={isUploadFileOpen}
        onOpenChange={setIsUploadFileOpen}
        onSubmit={handleFileUpload}
      />

      <DeleteAlertDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        item={itemToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
