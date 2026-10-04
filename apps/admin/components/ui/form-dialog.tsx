"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** One sentence under the title. */
  description?: React.ReactNode;
  /** The `id` of the `<form>` rendered in `children`; the footer's submit targets it. */
  formId: string;
  /** True once a field differs from what the dialog opened with. */
  isDirty: boolean;
  /** The save is running: both buttons are disabled, the primary shows it. */
  isPending?: boolean;
  /** « Ajouter » for a creation, « Enregistrer » for an edit. */
  submitLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * A dialog around a form (direction B): title, one-sentence description,
 * the form, then « Annuler » and the one primary. Closing it with unsaved
 * changes — Escape, a click outside, the close button or « Annuler » —
 * first asks « Abandonner les modifications ? ». A successful save closes
 * it through `onOpenChange(false)` without the question.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  formId,
  isDirty,
  isPending = false,
  submitLabel,
  pendingLabel = "Enregistrement…",
  cancelLabel = "Annuler",
  children,
  className,
}: FormDialogProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const requestClose = React.useCallback(() => {
    if (isPending) return;
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(false);
  }, [isDirty, isPending, onOpenChange]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    requestClose();
  };

  const discard = () => {
    setConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={cn("sm:max-w-[600px]", className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={requestClose}
              disabled={isPending}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={isPending}
              aria-busy={isPending || undefined}
            >
              {isPending && <Loader2 className="animate-spin" aria-hidden />}
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onDiscard={discard}
      />
    </>
  );
}

export interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}

/** « Abandonner les modifications ? » with « Continuer la saisie » as the safe default. */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abandonner les modifications ?</AlertDialogTitle>
          <AlertDialogDescription>
            Ce que vous avez saisi n&apos;a pas été enregistré et sera perdu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuer la saisie</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              onDiscard();
            }}
          >
            Abandonner
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
