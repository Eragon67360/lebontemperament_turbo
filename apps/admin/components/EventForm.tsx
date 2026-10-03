// components/EventForm.tsx
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
import { eventFormSchema, type EventFormValues } from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Event } from "@repo/domain/types/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

export type { EventFormValues };

interface EventFormProps {
  onSubmit: (values: EventFormValues) => Promise<void>;
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
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      date_from: initialData?.date_from
        ? new Date(initialData.date_from)
        : undefined,
      date_to: initialData?.date_to ? new Date(initialData.date_to) : undefined,
      time: initialData?.time.slice(0, 5) || "",
      location: initialData?.location || "",
      responsible_name: initialData?.responsible_name || "",
      responsible_email: initialData?.responsible_email || "",
      event_type: initialData?.event_type || "autre",
      link: initialData?.link || "",
      description: initialData?.description || "",
      is_public: initialData?.is_public || false,
    },
  });
  const dateFrom = useWatch({ control: form.control, name: "date_from" });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="title">Titre</FormLabel>
              <FormControl>
                <Input
                  id="title"
                  className="min-h-11"
                  aria-required
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
            name="date_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="date_from">Date de début</FormLabel>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="date_from"
                        ref={field.ref}
                        type="button"
                        variant={"outline"}
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
            name="date_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="date_to">Date de fin (optionnel)</FormLabel>
                <Popover modal>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="date_to"
                        ref={field.ref}
                        type="button"
                        variant={"outline"}
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
                      disabled={(date) => (dateFrom ? date < dateFrom : false)}
                      autoFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  className="min-h-11"
                  aria-required
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="location">Lieu</FormLabel>
              <FormControl>
                <Input
                  id="location"
                  className="min-h-11"
                  aria-required
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
            name="responsible_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="responsible_name">Responsable</FormLabel>
                <FormControl>
                  <Input
                    id="responsible_name"
                    className="min-h-11"
                    aria-required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsible_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="responsible_email">
                  Email du responsable (optionnel)
                </FormLabel>
                <FormControl>
                  <Input
                    id="responsible_email"
                    type="email"
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
          name="event_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="event_type">Type d&apos;événement</FormLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger
                    id="event_type"
                    ref={field.ref}
                    aria-required
                    className="min-h-11"
                  >
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="repetition">Répétition</SelectItem>
                  <SelectItem value="sejour">Séjour</SelectItem>
                  <SelectItem value="vente">Vente</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="link">
                Lien de l&apos;évènement (optionnel)
              </FormLabel>
              <FormControl>
                <Input id="link" className="min-h-11" {...field} />
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
              <FormLabel htmlFor="description">
                Description (optionnel)
              </FormLabel>
              <FormControl>
                <Textarea id="description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    id="is_public"
                    ref={field.ref}
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormLabel
                  htmlFor="is_public"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Événement public
                </FormLabel>
              </div>
              <p className="text-muted-foreground text-sm">
                Si coché, l&apos;événement sera visible sur le site public.
                Sinon, il ne sera visible que pour les membres.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

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
    </Form>
  );
}
