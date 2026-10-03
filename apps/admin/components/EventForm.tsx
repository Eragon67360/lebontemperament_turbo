// components/EventForm.tsx
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Event } from "@repo/domain/types/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface EventFormProps {
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
  ) => Promise<void>;
  loading: boolean;
  initialData?: Event | null;
  submitLabel: string;
}

export function EventForm({
  onSubmit,
  loading,
  initialData,
  submitLabel,
}: EventFormProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  useEffect(() => {
    if (initialData?.date_from) {
      setDateFrom(new Date(initialData.date_from));
    }
    if (initialData?.date_to) {
      setDateTo(new Date(initialData.date_to));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e, dateFrom, dateTo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          name="title"
          className="min-h-11"
          required
          defaultValue={initialData?.title || ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date_from">Date de début</Label>
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                id="date_from"
                type="button"
                variant={"outline"}
                className={cn(
                  "min-h-11 w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" aria-hidden />
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
                autoFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_to">Date de fin (optionnel)</Label>
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                id="date_to"
                type="button"
                variant={"outline"}
                className={cn(
                  "min-h-11 w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" aria-hidden />
                {dateTo ? (
                  format(dateTo, "PPP", { locale: fr })
                ) : (
                  <span>Choisir une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                disabled={(date) => (dateFrom ? date < dateFrom : false)}
                autoFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Heure</Label>
        <Input
          id="time"
          name="time"
          type="time"
          className="min-h-11"
          required
          defaultValue={initialData?.time.slice(0, 5) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input
          id="location"
          name="location"
          className="min-h-11"
          required
          defaultValue={initialData?.location || ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="responsible_name">Responsable</Label>
          <Input
            id="responsible_name"
            name="responsible_name"
            className="min-h-11"
            required
            defaultValue={initialData?.responsible_name || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsible_email">
            Email du responsable (optionnel)
          </Label>
          <Input
            id="responsible_email"
            name="responsible_email"
            type="email"
            className="min-h-11"
            defaultValue={initialData?.responsible_email || ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_type">Type d&apos;événement</Label>
        <Select
          name="event_type"
          required
          defaultValue={initialData?.event_type || "autre"}
        >
          <SelectTrigger id="event_type" className="min-h-11">
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concert">Concert</SelectItem>
            <SelectItem value="repetition">Répétition</SelectItem>
            <SelectItem value="sejour">Séjour</SelectItem>
            <SelectItem value="vente">Vente</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="link">Lien de l&apos;évènement (optionnel)</Label>
        <Input
          id="link"
          name="link"
          className="min-h-11"
          defaultValue={initialData?.link || ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description || ""}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_public"
            name="is_public"
            defaultChecked={initialData?.is_public || false}
          />
          <Label
            htmlFor="is_public"
            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Événement public
          </Label>
        </div>
        <p className="text-muted-foreground text-sm">
          Si coché, l&apos;événement sera visible sur le site public. Sinon, il
          ne sera visible que pour les membres.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          className="min-h-11 w-full sm:w-auto"
          disabled={loading}
        >
          {loading ? "Chargement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
