"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { CADialog, type CAFormValues } from "@/components/ca/CADialog";
import { CARow } from "@/components/ca/CARow";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { useCAs, useCreateCA, useDeleteCA } from "@/hooks/useCAs";
import {
  caCountLabel,
  meetingDateLabel,
  sortByMeetingDate,
} from "@/utils/ca/list";
import type { CA } from "@repo/domain/types/ca";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ConseilsAdministration() {
  const { data: cas = [], isLoading, isError, refetch } = useCAs();
  const createCA = useCreateCA();
  const deleteCA = useDeleteCA();

  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // The item stays set while the dialog closes, so its text never empties.
  const [deleting, setDeleting] = useState<CA | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async ({ title, date, file }: CAFormValues) => {
    setIsCreating(true);
    try {
      let file_url = null;

      if (file) {
        const fileFormData = new FormData();
        fileFormData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok)
          throw new Error("Erreur lors de l'upload du fichier");

        const { url } = await uploadResponse.json();
        file_url = url;
      }

      await createCA.mutateAsync({
        title,
        date_from: format(date, "yyyy-MM-dd"),
        file_url,
      });

      toast.success("Compte rendu ajouté");
    } catch (error) {
      toast.error("Le compte rendu n'a pas pu être ajouté", {
        description: "Vérifiez votre connexion, puis réessayez.",
      });
      console.error(error);
      // The dialog stays open with what was typed.
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteCA.mutateAsync(deleting.id);
      toast.success(`« ${deleting.title} » supprimé`);
      setConfirmOpen(false);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: "Vérifiez votre connexion, puis réessayez.",
      });
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedCAs = sortByMeetingDate(cas);

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Comptes rendus du CA"
      description="Les comptes rendus des réunions du conseil d'administration, du plus récent au plus ancien."
      headerAction={
        <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
          <Plus aria-hidden />
          Ajouter un compte rendu
        </Button>
      }
    >
      <section aria-labelledby="ca-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ca-heading" className="text-section">
            Archives
          </h2>
          {sortedCAs.length > 0 && (
            <p className="text-note text-muted-foreground">
              {caCountLabel(sortedCAs.length)}
            </p>
          )}
        </div>
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={sortedCAs.length === 0}
          onRetry={() => refetch()}
          errorDescription="Les comptes rendus n'ont pas pu être chargés."
          skeleton={
            <ListSkeleton rows={4} label="Chargement des comptes rendus…" />
          }
          empty={
            <EmptyState
              icon={FileText}
              title="Aucun compte rendu"
              description="Archivez ici les comptes rendus des conseils d'administration, avec leur PDF, pour les retrouver facilement."
              className="py-6"
              action={
                <Button variant="outline" onClick={() => setOpen(true)}>
                  <Plus aria-hidden />
                  Ajouter le premier
                </Button>
              }
            />
          }
        >
          <ul className="space-y-3">
            {sortedCAs.map((ca) => (
              <li key={ca.id} className="list-none">
                <CARow
                  ca={ca}
                  onDelete={() => {
                    setDeleting(ca);
                    setConfirmOpen(true);
                  }}
                />
              </li>
            ))}
          </ul>
        </DataState>
      </section>

      <CADialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleCreate}
        isPending={isCreating}
      />

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next && !isDeleting) setConfirmOpen(false);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.title ?? ""} » ?`}
        description={`Le compte rendu de la réunion du ${
          deleting ? meetingDateLabel(deleting.date_from) : ""
        }${
          deleting?.file_url
            ? " et son fichier PDF sont supprimés"
            : " est supprimé"
        } des archives. Cette action ne peut pas être annulée.`}
        isLoading={isDeleting}
      />
    </PageShell>
  );
}
