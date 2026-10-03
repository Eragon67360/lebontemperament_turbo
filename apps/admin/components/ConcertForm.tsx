// components/ConcertForm.tsx
"use client";

import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { concertFormSchema, type ConcertFormValues } from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Concert } from "@repo/domain/types/concerts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export type { ConcertFormValues };

interface ConcertFormProps {
  onSubmit: (
    values: ConcertFormValues,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<ConcertFormValues>({
    resolver: zodResolver(concertFormSchema),
    defaultValues: {
      concertName: initialData?.name || "",
      place: initialData?.place || "",
      date: initialData?.date ? new Date(initialData.date) : undefined,
      time: initialData?.time.slice(0, 5) || "",
      context: initialData?.context as ConcertFormValues["context"] | undefined,
      additional_informations: initialData?.additional_informations || "",
      related_link: initialData?.related_link || "",
    },
  });

  const handleSubmit = async (values: ConcertFormValues) => {
    await onSubmit(values, selectedFile);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="concertName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="concertName">
                Nom du concert (optionnel)
              </FormLabel>
              <FormControl>
                <Input
                  id="concertName"
                  type="text"
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="place"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="place">Lieu</FormLabel>
              <FormControl>
                <Input
                  id="place"
                  aria-required
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="concert-date">Date</FormLabel>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="concert-date"
                        ref={field.ref}
                        type="button"
                        variant="outline"
                        aria-required
                        className={cn(
                          "min-h-11 w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="h-4 w-4" aria-hidden />
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      autoFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="time">Heure</FormLabel>
                <FormControl>
                  <Input
                    id="time"
                    type="time"
                    aria-required
                    className="min-h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="context"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="context">Contexte</FormLabel>
              <Select
                name={field.name}
                value={field.value ?? ""}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger
                    id="context"
                    ref={field.ref}
                    aria-required
                    className="min-h-11"
                  >
                    <SelectValue placeholder="Sélectionner un contexte" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="orchestre">Orchestre</SelectItem>
                  <SelectItem value="choeur">Chœur</SelectItem>
                  <SelectItem value="orchestre_et_choeur">
                    Orchestre et Chœur
                  </SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="additional_informations"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="additional_informations">
                Informations supplémentaires
              </FormLabel>
              <FormControl>
                <Textarea id="additional_informations" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="related_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="related_link">
                Lien connexe (optionnel)
              </FormLabel>
              <FormControl>
                <Input
                  id="related_link"
                  type="text"
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
    </Form>
  );
}
