"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { meetingDateLabel } from "@/utils/ca/list";
import { parseIsoDate } from "@/utils/concerts/schedule";
import type { CA } from "@repo/domain/types/ca";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink, FileText, MoreHorizontal, Trash2 } from "lucide-react";

/**
 * One meeting of « Comptes rendus du CA »: month and year block, title,
 * meeting day, « Ouvrir le PDF » when a file is attached, and a « ⋯ » menu
 * holding « Supprimer ».
 */
export function CARow({
  ca,
  onDelete,
}: {
  ca: Pick<CA, "id" | "title" | "date_from" | "file_url">;
  onDelete: () => void;
}) {
  const date = parseIsoDate(ca.date_from);

  return (
    <Card className="flex items-start gap-4 p-4">
      <div
        className="bg-primary-soft text-primary-text grid size-14 shrink-0 place-items-center rounded-md"
        aria-hidden
      >
        {date ? (
          <span className="flex flex-col items-center leading-none">
            <span className="text-note uppercase">
              {format(date, "MMM", { locale: fr })}
            </span>
            <span className="mt-0.5 text-base font-semibold">
              {format(date, "yyyy")}
            </span>
          </span>
        ) : (
          <FileText className="size-6" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-body min-w-0 font-semibold break-words">
            {ca.title}
          </h3>
          <p className="text-note text-muted-foreground">
            Réunion du {meetingDateLabel(ca.date_from)}
          </p>
        </div>

        {ca.file_url ? (
          <div>
            <Button variant="outline" size="sm" asChild>
              <a href={ca.file_url} target="_blank" rel="noopener noreferrer">
                <FileText aria-hidden />
                Ouvrir le PDF
                <span className="sr-only">
                  {" "}
                  de « {ca.title} » (nouvel onglet)
                </span>
                <ExternalLink aria-hidden />
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-note text-muted-foreground inline-flex items-center gap-1.5">
            <FileText className="size-3.5 shrink-0" aria-hidden />
            Aucun fichier joint
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-1 shrink-0">
            <MoreHorizontal aria-hidden />
            <span className="sr-only">
              Plus d&apos;actions pour « {ca.title} »
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-danger-foreground focus:text-danger-foreground [&>svg]:text-danger"
          >
            <Trash2 aria-hidden />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
