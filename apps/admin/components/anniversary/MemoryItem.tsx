"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AnniversaryMemory } from "@/types/anniversary";
import {
  Calendar,
  CheckCircle2,
  Mail,
  Star,
  StarOff,
  Undo2,
} from "lucide-react";

export function MemoryItem({
  memory,
  busy,
  onPublish,
  onUnpublish,
  onFeature,
  onDelete,
}: {
  memory: AnniversaryMemory;
  busy: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onFeature: () => void;
  onDelete: () => void;
}) {
  const published = !!memory.is_approved;
  const date = memory.created_at
    ? new Date(memory.created_at).toLocaleDateString("fr-FR", {
        dateStyle: "long",
      })
    : null;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-body min-w-0 font-semibold break-words">
              {memory.name}
            </h2>
            <StatusBadge tone={published ? "success" : "warning"}>
              {published ? "Publié" : "En attente"}
            </StatusBadge>
            {memory.is_featured && (
              <StatusBadge tone="accent">À la une</StatusBadge>
            )}
          </div>
          <div className="text-note text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* Erased once the memory is approved (privacy policy, #355). */}
            {memory.email && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{memory.email}</span>
              </span>
            )}
            {memory.year && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5 shrink-0" aria-hidden />
                {memory.year}
              </span>
            )}
          </div>
        </div>
        {date && (
          <p className="text-note text-muted-foreground shrink-0">
            Reçu le {date}
          </p>
        )}
      </div>

      <blockquote className="bg-surface-sunken text-body rounded-md px-4 py-3 whitespace-pre-wrap">
        {memory.message}
      </blockquote>

      <div className="flex flex-wrap items-center gap-2">
        {published ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFeature}
              disabled={busy}
            >
              {memory.is_featured ? (
                <StarOff aria-hidden />
              ) : (
                <Star aria-hidden />
              )}
              {memory.is_featured ? "Retirer de la une" : "Mettre à la une"}
              <span className="sr-only"> (témoignage de {memory.name})</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUnpublish}
              disabled={busy}
            >
              <Undo2 aria-hidden />
              Retirer de la publication
              <span className="sr-only"> (témoignage de {memory.name})</span>
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" onClick={onPublish} disabled={busy}>
            <CheckCircle2 aria-hidden />
            Publier
            <span className="sr-only"> le témoignage de {memory.name}</span>
          </Button>
        )}
        <RowActionsMenu
          name={memory.name}
          subject={`le témoignage de ${memory.name}`}
          onDelete={onDelete}
          disabled={busy}
        />
      </div>
    </Card>
  );
}
