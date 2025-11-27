// components/FileExplorer/index.tsx
"use client";

import { Button } from "@/components/ui/button";
import { FileRecord, Folder } from "@/types/files";
import { createClient } from "@/utils/supabase/client";
import { FolderPlus, Loader2, Upload } from "lucide-react";
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
        toast.error("Impossible de charger le contenu");
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
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-4 transition-all duration-300 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-2">
        <div className="w-full overflow-x-auto sm:w-auto">
          <BreadcrumbNav
            currentFolder={currentFolder}
            onNavigate={(folder) => {
              setCurrentFolder(folder);
              loadContent(folder?.id);
            }}
          />
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          <Button
            onClick={() => setIsCreateFolderOpen(true)}
            variant="outline"
            size="sm"
            className="flex-1 transition-all duration-300 hover:scale-105 sm:flex-none"
          >
            <FolderPlus className="mr-2 hidden h-4 w-4 sm:inline" />
            <span className="whitespace-nowrap">Nouveau dossier</span>
          </Button>

          <Button
            onClick={() => setIsUploadFileOpen(true)}
            variant="default"
            size="sm"
            className="flex-1 transition-all duration-300 hover:scale-105 sm:flex-none"
          >
            <Upload className="mr-2 hidden h-4 w-4 sm:inline" />
            <span className="whitespace-nowrap">Ajouter un fichier</span>
          </Button>
        </div>
      </div>

      <div className="relative min-h-[200px] transition-all duration-300">
        {loading ? (
          <div className="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="border-border rounded-lg border p-4 transition-all duration-300">
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
        )}
      </div>

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
