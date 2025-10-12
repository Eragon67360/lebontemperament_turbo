"use client";

import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import { EventForm } from "@/components/EventForm";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Evenements() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
    dateTo: Date | null | undefined,
  ) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const eventData = {
      title: formData.get("title") as string,
      date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : "",
      date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : "",
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      responsible_name: formData.get("responsible_name") as string,
      responsible_email: (formData.get("responsible_email") as string) || null,
      event_type: formData.get("event_type") as string,
      description: (formData.get("description") as string) || null,
      link: (formData.get("link") as string) || null,
      is_public: formData.get("is_public") === "on",
    };

    try {
      const response = await fetch("/api/ca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout du CA");

      toast.success("CA ajouté avec succès");
      setOpen(false);
      // fetchCA();
    } catch (error) {
      toast.error("Erreur lors de l'ajout du CA");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
            <div>
              <Label htmlFor="title">Titre du CA (ex. CA du 25 mai 2025)</Label>
              <Input id="title" name="title" required defaultValue={""} />
            </div>
            <div>
              <Label>Date du CA</Label>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
