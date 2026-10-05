"use client";

import { useState } from "react";
import { toast } from "sonner";

type WithId = { id: string; is_visible?: boolean | null };

/**
 * The state every campaign list shares: the add/edit dialog, the delete
 * confirmation, « Masquer / Afficher », with the toasts that name the item.
 */
export function useListActions<T extends WithId>({
  update,
  remove,
  nameOf,
  feminine = false,
}: {
  /** The list's existing update endpoint, `{ id, is_visible }`. */
  update: (data: { id: string; is_visible: boolean }) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  nameOf: (item: T) => string;
  /** Agreement of « supprimée / masquée » with the item's noun. */
  feminine?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | undefined>(undefined);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const e = feminine ? "e" : "";

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const onDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditing(undefined);
  };

  const toggleVisibility = async (item: T) => {
    const next = item.is_visible === false;
    setBusyId(item.id);
    try {
      await update({ id: item.id, is_visible: next });
      toast.success(
        next
          ? `« ${nameOf(item)} » est de nouveau visible`
          : `« ${nameOf(item)} » est masqué${e}`,
      );
    } catch (error) {
      toast.error("Le changement n'a pas été enregistré", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await remove(deleting.id);
      toast.success(`« ${nameOf(deleting)} » supprimé${e}`);
      setDeleting(null);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    dialogOpen,
    editing,
    openCreate,
    openEdit,
    onDialogOpenChange,
    deleting,
    askDelete: (item: T) => setDeleting(item),
    cancelDelete: (open: boolean) => {
      if (!open && !isDeleting) setDeleting(null);
    },
    confirmDelete,
    isDeleting,
    busyId,
    toggleVisibility,
  };
}

/** « 3 vidéos · 2 visibles » under a list's header. */
export function countLine(
  items: readonly { is_visible?: boolean | null }[],
  one: string,
  many: string,
): string {
  const visible = items.filter((item) => item.is_visible !== false).length;
  const noun = items.length > 1 ? many : one;
  if (visible === items.length) return `${items.length} ${noun}`;
  return `${items.length} ${noun} · ${visible} visible${visible > 1 ? "s" : ""}`;
}
