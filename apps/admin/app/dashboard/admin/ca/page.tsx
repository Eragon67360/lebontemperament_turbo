"use client";

import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { CA } from "@/types/ca";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Evenements() {
  const [cas, setCas] = useState<CA[]>([]);
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCA = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cas");
      const data = await response.json();
      setCas(data);
    } catch (error) {
      console.error("Error fetching CA:", error);
      toast.error("Erreur lors du chargement des CA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCA();
  }, []);

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

      const response = await fetch("/api/cas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caData),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout du CA");

      toast.success("CA ajouté avec succès");
      setOpen(false);
      setSelectedFile(null);
      setDateFrom(undefined);
      // e.currentTarget.reset();
      await fetchCA();
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
      const response = await fetch("/api/cas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("CA supprimé avec succès");
      await fetchCA();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="space-y-1.5">
            <DashboardPageHeader
              title="Compte-rendus de CA"
              description="Importez les compte-rendus de CA"
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6">
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
        </div>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="space-y-4 text-center">
            <FileText className="text-primary/50 mx-auto h-12 w-12 animate-pulse" />
            <p className="text-muted-foreground text-sm">
              Chargement des comptes-rendus...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-full max-h-screen grow flex-col overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-col items-center justify-between gap-6 sm:flex-row md:mb-8">
        <div className="space-y-1.5">
          <DashboardPageHeader
            title="Compte-rendus de CA"
            description="Importez les compte-rendus de CA"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6">
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
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:pr-2">
        {cas.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
            <div className="space-y-4 text-center">
              <FileText className="text-primary/30 mx-auto h-16 w-16" />
              <h2 className="text-xl font-medium">Aucun compte-rendu de CA</h2>
              <p className="text-muted-foreground max-w-sm text-sm">
                Commencez par ajouter votre premier compte-rendu de CA
              </p>
            </div>
            <Button className="rounded-full px-6" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un CA
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cas.map((ca) => (
              <div
                key={ca.id}
                className="border-border/50 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:bg-black"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
