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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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

// --- Utility Components ---

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-muted/40 h-[160px] w-full animate-pulse rounded-2xl border"
      />
    ))}
  </div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
    <div className="bg-primary/5 ring-primary/5 flex h-20 w-20 items-center justify-center rounded-full ring-8">
      <FileText className="text-primary/40 h-10 w-10" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">
        Aucun compte-rendu
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Archivez les décisions et les discussions de vos conseils
        d'administration ici.
      </p>
    </div>
    <Button onClick={onAdd} className="px-8">
      <Plus className="mr-2 h-4 w-4" />
      Ajouter un CA
    </Button>
  </div>
);

// --- Sub-Components ---

const CACard = ({
  ca,
  onDelete,
}: {
  ca: any; // Using any here if type isn't strictly defined, ideally CA
  onDelete: (id: string) => void;
}) => {
  const dateObj = new Date(ca.date_from);

  return (
    <Card className="group bg-card hover:border-primary/50 relative flex overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
      {/* Date Tile */}
      <div className="bg-muted/20 hidden min-w-[100px] flex-col items-center justify-center border-r px-5 py-4 text-center sm:flex">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {format(dateObj, "MMM", { locale: fr })}
        </span>
        <span className="text-foreground text-3xl leading-none font-black">
          {format(dateObj, "yyyy")}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-lg font-bold tracking-tight">
              {ca.title}
            </h3>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4" />
              <span>{format(dateObj, "dd MMMM yyyy", { locale: fr })}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
            onClick={() => onDelete(ca.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-auto pt-4">
          {ca.file_url ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-secondary/50 hover:bg-secondary w-full justify-start gap-2"
              asChild
            >
              <a href={ca.file_url} target="_blank" rel="noopener noreferrer">
                <FileText className="text-primary h-4 w-4" />
                <span className="flex-1 truncate text-left">
                  Voir le compte-rendu
                </span>
                <Download className="h-3 w-3 opacity-50" />
              </a>
            </Button>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-2 text-sm">
              <FileText className="h-4 w-4 opacity-50" />
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
  const { data: cas = [], isLoading: loading } = useCAs();
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
      fullHeight
      theme="admin"
      className="px-4 py-8 sm:px-6 lg:px-8"
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
            <Button className="shadow-md transition-all hover:shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
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
                <Label>Date de la réunion</Label>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                      initialFocus
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

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Enregistrement..." : "Ajouter le CA"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <ScrollArea className="h-full w-full pr-4">
        {loading ? (
          <LoadingSkeleton />
        ) : sortedCAs.length === 0 ? (
          <EmptyState onAdd={() => setOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 px-1 pt-2 pb-12 md:grid-cols-2 xl:grid-cols-3">
            {sortedCAs.map((ca) => (
              <CACard key={ca.id} ca={ca} onDelete={handleDeleteClick} />
            ))}
          </div>
        )}
      </ScrollArea>

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
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
