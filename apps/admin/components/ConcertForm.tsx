// components/ConcertForm.tsx
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Concert } from "@repo/domain/types/concerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface ConcertFormProps {
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    date: Date | undefined,
    selectedFile: File | null,
  ) => Promise<void>;
  loading: boolean;
  initialData?: Concert | null;
  submitLabel: string;
  onClose?: () => void;
}

export function ConcertForm({
  onSubmit,
  loading,
  initialData,
  submitLabel,
  onClose,
}: ConcertFormProps) {
  const [date, setDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData?.date) {
      setDate(new Date(initialData.date));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e, date, selectedFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="concertName">Nom du concert (optionnel)</Label>
        <Input
          id="concertName"
          name="concertName"
          type="text"
          className="min-h-11"
          defaultValue={initialData?.name || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="place">Lieu</Label>
        <Input
          id="place"
          name="place"
          required
          className="min-h-11"
          defaultValue={initialData?.place || ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="concert-date">Date</Label>
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                id="concert-date"
                type="button"
                variant="outline"
                className={cn(
                  "min-h-11 w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" aria-hidden />
                {date ? (
                  format(date, "PPP", { locale: fr })
                ) : (
                  <span>Choisir une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                autoFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Heure</Label>
          <Input
            id="time"
            name="time"
            type="time"
            required
            className="min-h-11"
            defaultValue={initialData?.time.slice(0, 5) || ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="context">Contexte</Label>
        <Select name="context" required defaultValue={initialData?.context}>
          <SelectTrigger id="context" className="min-h-11">
            <SelectValue placeholder="Sélectionner un contexte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orchestre">Orchestre</SelectItem>
            <SelectItem value="choeur">Chœur</SelectItem>
            <SelectItem value="orchestre_et_choeur">
              Orchestre et Chœur
            </SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="additional_informations">
          Informations supplémentaires
        </Label>
        <Textarea
          id="additional_informations"
          name="additional_informations"
          rows={3}
          defaultValue={initialData?.additional_informations || ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Affiche (optionnel)</Label>
        <FileUpload
          onFileSelect={(file) => setSelectedFile(file)}
          onFileClear={() => setSelectedFile(null)}
          value={selectedFile}
          currentImageUrl={initialData?.affiche || null}
          mode="image"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="related_link">Lien connexe (optionnel)</Label>
        <Input
          id="related_link"
          name="related_link"
          type="text"
          className="min-h-11"
          defaultValue={initialData?.related_link || ""}
        />
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={onClose}
          >
            Annuler
          </Button>
        )}
        <Button type="submit" className="min-h-11" disabled={loading}>
          {loading ? "Chargement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
