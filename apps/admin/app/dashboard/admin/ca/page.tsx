"use client";

import { FileUpload } from "@/components/FileUpload";
import { PageShell } from "@/components/layouts/PageShell";
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
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  CardGridSkeleton,
  DataState,
  EmptyState,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CA } from "@repo/domain/types/ca";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCAs, useCreateCA, useDeleteCA } from "@/hooks/useCAs";

// --- Sub-Components ---

const CACard = ({
  ca,
  onDelete,
}: {
  ca: CA;
  onDelete: (id: string) => void;
}) => {
  const dateObj = new Date(ca.date_from);

  return (
    <Card className="bg-card hover:border-primary/50 flex overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-150 ease-out hover:shadow-md">
      {/* Date Tile */}
      <div className="bg-muted/20 hidden w-[100px] shrink-0 flex-col items-center justify-center border-r px-5 py-4 text-center sm:flex">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {format(dateObj, "MMM", { locale: fr })}
        </span>
        <span className="text-foreground text-3xl leading-none font-black">
          {format(dateObj, "yyyy")}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="line-clamp-2 text-base font-bold tracking-tight sm:text-lg">
              {ca.title}
            </h2>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                {format(dateObj, "dd MMMM yyyy", { locale: fr })}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-11 w-11 shrink-0"
            onClick={() => onDelete(ca.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">Supprimer « {ca.title} »</span>
          </Button>
        </div>

        <div className="mt-auto pt-4">
          {ca.file_url ? (
            <Button
              variant="outline"
              className="bg-secondary/50 hover:bg-secondary min-h-11 w-full justify-start gap-2"
              asChild
            >
              <a href={ca.file_url} target="_blank" rel="noopener noreferrer">
                <FileText className="text-primary h-4 w-4" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">
                  Voir le compte-rendu
                </span>
                <Download className="h-3 w-3 opacity-50" aria-hidden />
              </a>
            </Button>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
              <span>Aucun fichier joint</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// --- Main Component ---

export default function ConseilsAdministration() {
  const { data: cas = [], isLoading, isError, refetch } = useCAs();
  const createCA = useCreateCA();
  const deleteCA = useDeleteCA();

  // State
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caToDelete, setCaToDelete] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!dateFrom) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    setIsCreating(true);
    const formData = new FormData(e.currentTarget);

    try {
      let file_url = null;

      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok)
          throw new Error("Erreur lors de l'upload du fichier");

        const { url } = await uploadResponse.json();
        file_url = url;
      }

      const caData = {
        title: formData.get("title") as string,
        date_from: format(dateFrom, "yyyy-MM-dd"),
        file_url,
      };

      await createCA.mutateAsync(caData);

      toast.success("Compte-rendu ajouté");
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!caToDelete) return;

    try {
      await deleteCA.mutateAsync(caToDelete);
      toast.success("Compte-rendu supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setCaToDelete(null);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDateFrom(undefined);
  };

  // Sort CAs by date descending
  const sortedCAs = [...cas].sort(
    (a, b) => new Date(b.date_from).getTime() - new Date(a.date_from).getTime(),
  );

  return (
    <PageShell
      theme="admin"
      className="py-4 sm:py-6"
      title="Compte-rendus de CA"
      description="Gestion et archivage des documents du Conseil d'Administration."
      headerAction={
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="min-h-11 w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un CA
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouveau compte-rendu</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau document aux archives du CA.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du document</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Ex: Réunion du 25 mai 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ca-date">Date de la réunion</Label>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <Button
                      id="ca-date"
                      type="button"
                      variant="outline"
                      className={cn(
                        "min-h-11 w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" aria-hidden />
                      {dateFrom ? (
                        format(dateFrom, "PPP", { locale: fr })
                      ) : (
                        <span>Sélectionner une date...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      autoFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fichier PDF</Label>
                <div className="bg-muted/30 rounded-lg border p-2">
                  <FileUpload
                    onFileSelect={(file) => setSelectedFile(file)}
                    onFileClear={() => setSelectedFile(null)}
                    value={selectedFile}
                    currentImageUrl={null}
                    mode="pdf"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="min-h-11"
                  disabled={isCreating}
                >
                  {isCreating ? "Enregistrement..." : "Ajouter le CA"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={sortedCAs.length === 0}
        onRetry={() => refetch()}
        errorDescription="Les comptes-rendus n'ont pas pu être chargés."
        skeleton={
          <CardGridSkeleton cards={6} label="Chargement des comptes-rendus…" />
        }
        empty={
          <EmptyState
            icon={FileText}
            title="Aucun compte-rendu"
            description="Archivez les décisions et les discussions de vos conseils d'administration ici."
            action={
              <Button className="min-h-11" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un CA
              </Button>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedCAs.map((ca) => (
            <CACard key={ca.id} ca={ca} onDelete={handleDeleteClick} />
          ))}
        </div>
      </DataState>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte-rendu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fichier associé sera également
              supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-11"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
