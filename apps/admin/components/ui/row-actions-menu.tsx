"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Trash2 } from "lucide-react";
import * as React from "react";

/**
 * The accessible names of a row's « Plus d'actions » menu. `subject` names
 * the item in a sentence; it defaults to the name in guillemets
 * (« Requiem »), a row can pass its own (« le témoignage de Lucie »).
 */
export function rowActionsLabels(name: string, subject?: string) {
  const what = subject ?? `« ${name} »`;
  return {
    trigger: `Plus d'actions pour ${what}`,
    delete: `Supprimer ${what}`,
  };
}

export interface RowActionsMenuProps {
  /** The item's name, for the accessible names of the trigger and items. */
  name: string;
  /** Overrides « {name} » in the accessible names, e.g. « le témoignage de Lucie ». */
  subject?: string;
  /** Opens the row's confirmation (`DeleteConfirmDialog`); never deletes directly. */
  onDelete: () => void;
  /** The row's own write is running: the menu waits. */
  disabled?: boolean;
  /** The list's other real actions (`DropdownMenuItem`s), above a separator and « Supprimer… ». */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The quiet end of a list row: a 44 px « ⋯ » button (« Plus d'actions pour
 * « Requiem » ») opening a menu whose last item is « Supprimer… » in danger
 * text, after a separator when the row passes other items. The menu holds
 * only what the list can do. The item only asks: the row's page opens its `AlertDialog`, which
 * names the item. « Modifier » stays a visible outlined button beside it.
 */
export function RowActionsMenu({
  name,
  subject,
  onDelete,
  disabled = false,
  children,
  className,
}: RowActionsMenuProps) {
  const labels = rowActionsLabels(name, subject);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          title="Plus d'actions"
          className={cn(
            "text-muted-foreground hover:text-foreground data-[state=open]:border-primary-soft-border data-[state=open]:bg-primary-soft data-[state=open]:text-foreground",
            className,
          )}
        >
          <MoreHorizontal aria-hidden />
          <span className="sr-only">{labels.trigger}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={16}>
        {children}
        {React.Children.toArray(children).length > 0 && <DropdownMenuSeparator />}
        {/* Deferred so the menu has closed before the dialog takes the
            focus and the pointer-events lock (as in the account menu). */}
        <DropdownMenuItem
          variant="destructive"
          aria-label={labels.delete}
          onSelect={() => setTimeout(onDelete, 0)}
        >
          <Trash2 aria-hidden />
          Supprimer…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
