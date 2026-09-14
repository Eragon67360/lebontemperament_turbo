// components/FileExplorer/BreadcrumbNav.tsx
import { Button } from "@/components/ui/button";
import { Folder } from "@/types/files";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbNavProps {
  currentFolder: Folder | null;
  onNavigate: (folder: Folder | null) => void;
}

export function BreadcrumbNav({
  currentFolder,
  onNavigate,
}: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Fil d'Ariane des dossiers"
      className="flex min-w-0 items-center gap-1"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onNavigate(null)}
        className="size-11 shrink-0"
      >
        <Home className="h-4 w-4" aria-hidden />
        <span className="sr-only">Revenir à la racine</span>
      </Button>
      {currentFolder && (
        <>
          <ChevronRight
            className="text-muted-foreground h-4 w-4 shrink-0"
            aria-hidden
          />
          <span
            aria-current="page"
            className="min-w-0 truncate px-2 text-sm font-medium"
          >
            {currentFolder.name}
          </span>
        </>
      )}
    </nav>
  );
}
