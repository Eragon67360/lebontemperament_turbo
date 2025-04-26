// components/VideoForm.tsx
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Video, VideoFormData } from "@/types/video";

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  composer: z.string().min(1, "Le compositeur est requis"),
  youtube_url: z
    .string()
    .min(1, "L'URL YouTube est requise")
    .url("URL invalide")
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
      "URL YouTube invalide",
    ),
  performance_date: z.date({
    required_error: "La date est requise",
  }),
  venue: z.string().min(1, "Le lieu est requis"),
  soloists: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
interface VideoFormProps {
  onSubmit: (data: VideoFormData) => void;
  initialData?: Video | null;
}

export function VideoForm({ onSubmit, initialData }: VideoFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      composer: initialData?.composer || "",
      youtube_url: initialData?.youtube_url || "",
      performance_date: initialData?.performance_date
        ? new Date(initialData.performance_date)
        : undefined,
      venue: initialData?.venue || "",
      soloists: initialData?.soloists ? initialData.soloists.join(", ") : "",
    },
  });

  const handleSubmit = async (values: FormData) => {
    const formattedData: VideoFormData = {
      title: values.title,
      composer: values.composer,
      youtube_url: values.youtube_url,
      performance_date: format(values.performance_date, "yyyy-MM-dd"),
      venue: values.venue,
      soloists: values.soloists
        ? values.soloists.split(",").map((s) => s.trim())
        : [],
    };

    await onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Titre de l'œuvre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="composer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compositeur</FormLabel>
              <FormControl>
                <Input placeholder="Nom du compositeur" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="youtube_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL YouTube</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="performance_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover modal>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "d MMMM yyyy", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lieu</FormLabel>
              <FormControl>
                <Input placeholder="Lieu de l'enregistrement" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="soloists"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solistes (séparés par des virgules)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nom des solistes, séparés par des virgules"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {initialData ? "Modifier" : "Ajouter"}
        </Button>
      </form>
    </Form>
  );
}
