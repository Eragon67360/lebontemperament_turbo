// components/FileExplorer/FileList.tsx
import { Button } from "@/components/ui/button";
import { FileRecord, Folder } from "@/types/files";
import { File as FileIcon, Folder as FolderIcon, Trash2 } from "lucide-react";

interface FileListProps {
  folders: Folder[];
  files: FileRecord[];
  onFolderClick: (folder: Folder) => void;
  onDelete: (item: Folder | FileRecord) => void;
}

export function FileList({
  folders,
  files,
  onFolderClick,
  onDelete,
}: FileListProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {folders.length === 0 && files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Ce dossier est vide
        </div>
      ) : (
        <>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
            >
              <Button
                variant="ghost"
                className="flex-1 justify-start"
                onClick={() => onFolderClick(folder)}
              >
                <FolderIcon className="mr-2 h-4 w-4" />
                {folder.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(folder)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
            >
              <div className="flex items-center">
                <FileIcon className="mr-2 h-4 w-4" />
                {file.name}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onDelete(file)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
