// components/FileExplorer/FileList.tsx
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/data-state";
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
  // The empty message used to sit inside the grid, so it rendered squeezed into
  // the first column instead of centred under the toolbar.
  if (folders.length === 0 && files.length === 0) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="Ce dossier est vide"
        description="Créez un dossier ou ajoutez un fichier pour commencer."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {folders.map((folder) => (
        <Row
          key={folder.id}
          icon={<FolderIcon className="h-4 w-4 shrink-0" aria-hidden />}
          name={folder.name}
          onOpen={() => onFolderClick(folder)}
          onDelete={() => onDelete(folder)}
          deleteLabel={`Supprimer le dossier ${folder.name}`}
        />
      ))}

      {files.map((file) => (
        <Row
          key={file.id}
          icon={<FileIcon className="h-4 w-4 shrink-0" aria-hidden />}
          name={file.name}
          onDelete={() => onDelete(file)}
          deleteLabel={`Supprimer le fichier ${file.name}`}
        />
      ))}
    </div>
  );
}

function Row({
  icon,
  name,
  onOpen,
  onDelete,
  deleteLabel,
}: {
  icon: React.ReactNode;
  name: string;
  onOpen?: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <div className="hover:bg-accent flex min-w-0 items-center gap-1 rounded-lg pr-1 transition-colors duration-150 ease-out motion-reduce:transition-none">
      {onOpen ? (
        <Button
          variant="ghost"
          onClick={onOpen}
          className="min-h-11 min-w-0 flex-1 justify-start gap-2 font-normal"
        >
          {icon}
          <span className="truncate">{name}</span>
        </Button>
      ) : (
        <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-4 text-sm">
          {icon}
          <span className="truncate">{name}</span>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive size-11 shrink-0"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        <span className="sr-only">{deleteLabel}</span>
      </Button>
    </div>
  );
}
