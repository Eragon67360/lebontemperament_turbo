"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SiteDocument } from "@repo/domain/types/documents";
import { documentDateLabel, fileSizeLabel } from "@repo/domain/utils/documents";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  FileText,
  History,
  Pencil,
} from "lucide-react";

/**
 * One PDF of « Documents de l'association »: title, date, collection, who
 * sees it and its size; « Ouvrir » and « Modifier » visible; « Historique »,
 * « Archiver » / « Remettre en ligne » and, for superadmins, « Supprimer… »
 * in the « ⋯ » menu.
 */
export function DocumentRow({
  document,
  collectionLabel,
  fileUrl,
  onEdit,
  onHistory,
  onArchive,
  onRestore,
  onDelete,
  busy = false,
}: {
  document: SiteDocument;
  collectionLabel: string;
  fileUrl: string;
  onEdit: () => void;
  onHistory: () => void;
  onArchive: () => void;
  onRestore: () => void;
  /** Superadmins only. */
  onDelete?: () => void;
  busy?: boolean;
}) {
  const archived = document.status === "archived";
  const meta = [
    collectionLabel,
    documentDateLabel(document.document_date, document.date_precision),
    fileSizeLabel(document.size_bytes),
  ].filter(Boolean);

  return (
    <Card className="flex items-start gap-4 p-4">
      <div
        className="bg-primary-soft text-primary-text grid size-12 shrink-0 place-items-center rounded-md"
        aria-hidden
      >
        <FileText className="size-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body min-w-0 font-semibold break-words">
              {document.title}
            </h3>
            {archived ? (
              <StatusBadge tone="neutral">Archivé</StatusBadge>
            ) : document.visibility === "public" ? (
              <StatusBadge tone="info">Public</StatusBadge>
            ) : (
              <StatusBadge tone="accent">Membres</StatusBadge>
            )}
          </div>
          <p className="text-note text-muted-foreground">{meta.join(" · ")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
            <Pencil aria-hidden />
            Modifier
            <span className="sr-only"> « {document.title} »</span>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <FileText aria-hidden />
              Ouvrir le PDF
              <span className="sr-only">
                {" "}
                « {document.title} » (nouvel onglet)
              </span>
              <ExternalLink aria-hidden />
            </a>
          </Button>
        </div>
      </div>

      <RowActionsMenu
        name={document.title}
        onDelete={onDelete}
        disabled={busy}
        className="-mt-1 -mr-1 shrink-0"
      >
        <DropdownMenuItem onSelect={() => setTimeout(onHistory, 0)}>
          <History aria-hidden />
          Historique
        </DropdownMenuItem>
        {archived ? (
          <DropdownMenuItem onSelect={onRestore}>
            <ArchiveRestore aria-hidden />
            Remettre en ligne
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onArchive}>
            <Archive aria-hidden />
            Archiver
          </DropdownMenuItem>
        )}
      </RowActionsMenu>
    </Card>
  );
}
