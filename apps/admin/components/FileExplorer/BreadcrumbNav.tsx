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
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(null)}
            >
                <Home className="h-4 w-4" />
            </Button>
            {currentFolder && (
                <>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Button
                        variant="ghost"
                        size="sm"
                    >
                        {currentFolder.name}
                    </Button>
                </>
            )}
        </div>
    );
}
