// components/FileExplorer/index.tsx
"use client";

import { Button } from "@/components/ui/button";
import { DataState, ListSkeleton } from "@/components/ui/data-state";
import { useCreateFile, useDeleteFile, useFiles } from "@/hooks/useFiles";
import {
  useCreateFolder,
  useDeleteFolder,
  useFolders,
} from "@/hooks/useFolders";
import { FileRecord, Folder } from "@/types/files";
import { createClient } from "@/utils/supabase/client";
import { checkWorkFile, workFileStoragePath } from "@/utils/workFiles";
import { FolderPlus, Upload } from "lucide-react";
import { useState } from "react";
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
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<
    (Folder | FileRecord) | null
  >(null);

  const foldersQuery = useFolders(programId, groupId);
  const filesQuery = useFiles(programId, groupId, currentFolder?.id);
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();
  const deleteFolder = useDeleteFolder();
  const deleteFile = useDeleteFile();

  const folders = foldersQuery.data ?? [];
  const files = filesQuery.data ?? [];
  const loading = foldersQuery.isPending || filesQuery.isPending;
  // A failed load used to leave an empty explorer behind, which reads as
  // "this folder is empty" rather than "this did not load".
  const failed = foldersQuery.isError || filesQuery.isError;

  const handleDeleteRequest = (item: Folder | FileRecord) => {
    setItemToDelete(item);
  };

  const handleCreateFolder = async (name: string) => {
    toast.promise(
      async () => {
        await createFolder.mutateAsync({
          name,
          program_id: programId,
          group_id: groupId,
          parent_folder_id: currentFolder?.id,
        });

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
    // The dialog already refuses files the bucket would refuse.
    const check = checkWorkFile(file);
    if (!check.ok) {
      toast.error(check.error);
      return;
    }

    toast.promise(
      async () => {
        const supabase = createClient();
        const bucket = supabase.storage.from("programs");

        const path = workFileStoragePath(
          programId,
          groupId,
          file.name,
          Date.now(),
        );

        // Re-wrapped so the upload carries the checked type: the bucket
        // compares it with its allow-list, and browsers send none for some
        // scores and MIDI files.
        const body = new File([file], file.name, { type: check.contentType });
        const { error: uploadError } = await bucket.upload(path, body, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadError) throw uploadError;

        try {
          await createFile.mutateAsync({
            name: file.name,
            original_name: file.name,
            size: file.size,
            mime_type: check.contentType,
            storage_path: path,
            program_id: programId,
            group_id: groupId,
            folder_id: currentFolder?.id,
          });
        } catch (error) {
          // No row points to the object: remove it rather than orphan it.
          await bucket.remove([path]);
          throw error;
        }

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
        if (isFolder) {
          await deleteFolder.mutateAsync(itemToDelete.id);
        } else {
          await deleteFile.mutateAsync(itemToDelete.id);
        }

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
            onNavigate={(folder) => setCurrentFolder(folder)}
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
        onRetry={() => {
          foldersQuery.refetch();
          filesQuery.refetch();
        }}
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
            onFolderClick={(folder) => setCurrentFolder(folder)}
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
