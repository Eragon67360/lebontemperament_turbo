"use client";

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
import { Tour } from "@/types/tours";
import { tourFormSchema, type TourFormValues } from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FileUpload } from "./FileUpload";

export type { TourFormValues };

interface TourFormProps {
  onSubmit: (
    values: TourFormValues,
    selectedFile: File | null,
  ) => Promise<void>;
  loading: boolean;
  initialData: Tour | null;
  submitLabel: string;
  onClose?: () => void;
}

export function TourForm({
  onSubmit,
  loading,
  initialData,
  submitLabel,
  onClose,
}: TourFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<TourFormValues>({
    resolver: zodResolver(tourFormSchema),
    defaultValues: {
      tourName: initialData?.name ?? "",
      description: initialData?.description || "",
      context:
        (initialData?.context as TourFormValues["context"] | undefined) ||
        "orchestre",
      start_date: initialData?.start_date
        ? new Date(initialData.start_date)
        : undefined,
      end_date: initialData?.end_date
        ? new Date(initialData.end_date)
        : undefined,
    },
  });
  const startDate = useWatch({ control: form.control, name: "start_date" });

  const handleSubmit = async (values: TourFormValues) => {
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
          name="tourName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="tourName">Nom de la tournée</FormLabel>
              <FormControl>
                <Input
                  id="tourName"
                  aria-required
                  className="min-h-11"
                  placeholder="Ex: Tournée d'été 2024"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="description">Description</FormLabel>
              <FormControl>
                <Textarea
                  id="description"
                  placeholder="Description de la tournée..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="context"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="context">Type</FormLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger
                    id="context"
                    ref={field.ref}
                    className="min-h-11"
                  >
                    <SelectValue placeholder="Sélectionnez un type" />
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="tour-start-date">Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="tour-start-date"
                        ref={field.ref}
                        type="button"
                        variant="outline"
                        className={cn(
                          "min-h-11 w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="h-4 w-4" aria-hidden />
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy", { locale: fr })
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
                      locale={fr}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="tour-end-date">Date de fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="tour-end-date"
                        ref={field.ref}
                        type="button"
                        variant="outline"
                        className={cn(
                          "min-h-11 w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="h-4 w-4" aria-hidden />
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy", { locale: fr })
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
                      locale={fr}
                      autoFocus
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tour_poster">Affiche de la tournée</Label>
          <FileUpload
            onFileSelect={(file) => setSelectedFile(file)}
            onFileClear={() => setSelectedFile(null)}
            value={selectedFile}
            currentImageUrl={initialData?.tour_poster || null}
            mode="image"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
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
            {loading && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
