"use client";

import { FileUpload } from "@/components/FileUpload";
import { PageShell } from "@/components/layouts/PageShell";
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
import { Calendar as CalendarIcon, FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCAs, useCreateCA, useDeleteCA } from "@/hooks/useCAs";

export default function Evenements() {
  const { data: cas = [], isLoading: loading } = useCAs();
  const createCA = useCreateCA();
  const deleteCA = useDeleteCA();

  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
  ) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);

    try {
      let file_url = null;

      // If there's a file, upload it first
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
        date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
        file_url,
      };

      await createCA.mutateAsync(caData);

      toast.success("CA ajouté avec succès");
      setOpen(false);
      setSelectedFile(null);
      setDateFrom(undefined);
    } catch (error) {
      toast.error("Erreur lors de l'ajout du CA");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce CA ?")) return;

    try {
      await deleteCA.mutateAsync(id);

      toast.success("CA supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <PageShell
        fullHeight
        theme="admin"
        className="px-4 py-8 sm:px-6 lg:px-8"
        title="Compte-rendus de CA"
        description="Importez les compte-rendus de CA"
        headerAction={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="px-6" disabled>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un CA
              </Button>
            </DialogTrigger>
          </Dialog>
        }
      >
        <ScrollArea className="pr-4">
          <div className="space-y-4 px-1">
            {/* Skeleton loading cards */}
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl"
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-5 w-3/4 rounded bg-gray-200"></div>
                      <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                      <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </PageShell>
    );
  }

  return (
    <PageShell
      fullHeight
      theme="admin"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Compte-rendus de CA"
      description="Importez les compte-rendus de CA"
      headerAction={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="px-6">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un CA
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                Ajouter un nouveau CA
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Entrez les informations pour ce CA
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => handleCreate(e, dateFrom)}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    Titre du CA (ex. CA du 25 mai 2025)
                  </Label>
                  <Input id="title" name="title" required defaultValue={""} />
                </div>
                <div>
                  <Label>Date du CA</Label>
                  <Popover modal>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? (
                          format(dateFrom, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
                <div>
                  <Label>Compte-rendu (fichier PDF)</Label>
                  <FileUpload
                    onFileSelect={(file) => setSelectedFile(file)}
                    onFileClear={() => setSelectedFile(null)}
                    value={selectedFile}
                    currentImageUrl={null}
                    mode="pdf"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setSelectedFile(null);
                      setDateFrom(undefined);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Enregistrement..." : "Ajouter"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <ScrollArea className="pr-4">
        {cas.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
            <div className="space-y-4 text-center">
              <FileText className="text-primary/30 mx-auto h-16 w-16" />
              <h2 className="text-xl font-medium">Aucun compte-rendu de CA</h2>
              <p className="text-muted-foreground max-w-sm text-sm">
                Commencez par ajouter votre premier compte-rendu de CA
              </p>
            </div>
            <Button className="px-6">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un CA
            </Button>
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {cas.map((ca) => (
              <Card
                key={ca.id}
                className="overflow-hidden rounded-2xl transition-all duration-300 dark:bg-black"
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium md:text-lg">
                        {ca.title}
                      </h3>
                      <div className="text-muted-foreground flex items-center text-xs md:text-sm">
                        <CalendarIcon className="text-muted-foreground/70 mr-2 h-4 w-4" />
                        <span>
                          {format(new Date(ca.date_from), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      {ca.file_url && (
                        <div>
                          <a
                            href={ca.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary flex items-center gap-2 text-sm hover:underline md:text-base"
                          >
                            <FileText className="h-4 w-4" />
                            Voir le compte-rendu (PDF)
                          </a>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive rounded-full"
                      onClick={() => handleDelete(ca.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </PageShell>
  );
}
