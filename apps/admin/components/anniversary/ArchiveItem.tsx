"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnniversaryArchive } from "@/types/anniversary";
import { Calendar, Edit, Eye, EyeOff, FileText, Trash2 } from "lucide-react";

const typeLabels: Record<string, string> = {
  "assemblée-générale": "Assemblée Générale",
  "rapport-annuel": "Rapport Annuel",
  "rapport-financier": "Rapport Financier",
  gazette: "Gazette",
  programme: "Programme",
  "document-historique": "Document Historique",
};

interface ArchiveItemProps {
  archive: AnniversaryArchive;
  onEdit: (archive: AnniversaryArchive) => void;
  onDelete: (archive: AnniversaryArchive) => void;
}

export function ArchiveItem({ archive, onEdit, onDelete }: ArchiveItemProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        !archive.is_visible && "opacity-60",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Icon Preview */}
          <div className="bg-muted flex aspect-video w-full shrink-0 items-center justify-center sm:w-48">
            <FileText className="text-muted-foreground h-12 w-12" />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold">{archive.title}</h3>
                <Badge
                  variant={archive.is_visible ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {archive.is_visible ? (
                    <>
                      <Eye className="mr-1 h-3 w-3" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-1 h-3 w-3" />
                      Masqué
                    </>
                  )}
                </Badge>
              </div>

              <p className="text-muted-foreground line-clamp-2 text-sm">
                {archive.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {archive.year}
                </span>
                <Badge variant="outline" className="text-xs">
                  {typeLabels[archive.type] || archive.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {archive.theme}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {archive.file_size}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(archive)}
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(archive)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
