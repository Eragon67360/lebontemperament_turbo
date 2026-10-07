"use client";

import { useSortableHandle } from "@/components/anniversary/SortableList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
} from "lucide-react";
import * as React from "react";

export type ReorderControls = {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** A move is being saved: the arrows wait. */
  disabled?: boolean;
};

export interface ContentRowProps {
  /** The item's name, for the accessible names of its actions. */
  name: string;
  title: React.ReactNode;
  /** Small visual on the left: an icon tile or a thumbnail. */
  leading?: React.ReactNode;
  description?: React.ReactNode;
  /** Chips and short facts under the description. */
  meta?: React.ReactNode;
  /** Shown as « Visible » / « Masqué ». */
  visible: boolean | null | undefined;
  /** False for lists without a visibility state (concert stories, gallery videos). */
  showStatus?: boolean;
  /** Extra badges beside the status. */
  badges?: React.ReactNode;
  /** Content under the text, e.g. an audio player. */
  children?: React.ReactNode;
  onEdit: () => void;
  onToggleVisibility?: () => void;
  onDelete: () => void;
  /** Buttons before « Modifier », e.g. « Voir le document ». */
  extraActions?: React.ReactNode;
  reorder?: ReorderControls;
  /** The row's own write is running: its actions wait. */
  busy?: boolean;
  /** `card` stacks the visual on top (photo grid); `row` puts it on the left. */
  layout?: "row" | "card";
  className?: string;
}

/**
 * One item of a campaign list: visual, title, status, facts, then the same
 * actions everywhere (« Modifier », « Masquer » / « Afficher », and
 * « Supprimer… » inside the « Plus d'actions » menu) and the order controls
 * (drag handle, « Monter », « Descendre »).
 */
export function ContentRow({
  name,
  title,
  leading,
  description,
  meta,
  visible,
  showStatus = true,
  badges,
  children,
  onEdit,
  onToggleVisibility,
  onDelete,
  extraActions,
  reorder,
  busy = false,
  layout = "row",
  className,
}: ContentRowProps) {
  const handle = useSortableHandle();
  const isVisible = visible !== false;

  return (
    <Card
      className={cn(
        "flex gap-4 p-4",
        layout === "card" ? "flex-col" : "flex-col sm:flex-row sm:items-start",
        className,
      )}
    >
      {(handle || reorder) && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-1",
            layout === "card" ? "order-last justify-end" : "sm:flex-col",
          )}
        >
          {handle && (
            <button
              type="button"
              {...handle}
              disabled={reorder?.disabled}
              className="text-foreground-faint hover:bg-accent hover:text-foreground grid size-10 cursor-grab place-items-center rounded-md active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-55"
            >
              <GripVertical className="size-5" aria-hidden />
              <span className="sr-only">
                Déplacer « {name} » (glisser, ou Espace puis les flèches)
              </span>
            </button>
          )}
          {reorder && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={!reorder.canMoveUp || reorder.disabled}
                onClick={reorder.onMoveUp}
                title="Monter"
              >
                <ChevronUp aria-hidden />
                <span className="sr-only">Monter « {name} »</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={!reorder.canMoveDown || reorder.disabled}
                onClick={reorder.onMoveDown}
                title="Descendre"
              >
                <ChevronDown aria-hidden />
                <span className="sr-only">Descendre « {name} »</span>
              </Button>
            </>
          )}
        </div>
      )}

      {leading && (
        <div
          className={cn(
            "shrink-0",
            layout === "card" ? "-mx-4 -mt-4" : "",
            !isVisible && "opacity-60",
          )}
        >
          {leading}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={cn(
                "text-body min-w-0 font-semibold break-words",
                !isVisible && "text-muted-foreground",
              )}
            >
              {title}
            </h2>
            {showStatus && (
              <StatusBadge tone={isVisible ? "success" : "neutral"}>
                {isVisible ? "Visible" : "Masqué"}
              </StatusBadge>
            )}
            {badges}
          </div>
          {description && (
            <p className="text-detail text-muted-foreground line-clamp-2 break-words">
              {description}
            </p>
          )}
          {meta && (
            <div className="text-note text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              {meta}
            </div>
          )}
        </div>

        {children}

        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={busy}
          >
            <Pencil aria-hidden />
            Modifier
            <span className="sr-only"> « {name} »</span>
          </Button>
          {onToggleVisibility && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleVisibility}
              disabled={busy}
              aria-busy={busy || undefined}
            >
              {isVisible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {isVisible ? "Masquer" : "Afficher"}
              <span className="sr-only"> « {name} »</span>
            </Button>
          )}
          <RowActionsMenu name={name} onDelete={onDelete} disabled={busy} />
        </div>
      </div>
    </Card>
  );
}

/** A square teal tile for an icon on the left of a row. */
export function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary-soft text-primary-text grid size-12 shrink-0 place-items-center rounded-md">
      {children}
    </div>
  );
}

/** One fact in a row's meta line: icon + text. */
export function Fact({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      <span className="truncate">{children}</span>
    </span>
  );
}
