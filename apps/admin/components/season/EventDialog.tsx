"use client";

import {
  DateField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  EVENT_TYPES,
  eventFormSchema,
  type EventFormValues,
} from "@/utils/formSchemas";
import { EVENT_TYPE_LABELS, parseIsoDate } from "@/utils/season/schedule";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Event } from "@repo/domain/types/events";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const FORM_ID = "event-form";

/** Field labels and ids, also the order of the error summary. */
const LABELS = {
  title: { label: "Titre", id: "event-title" },
  event_type: { label: "Type d'événement", id: "event-type" },
  date_from: { label: "Premier jour", id: "event-date-from" },
  date_to: { label: "Dernier jour", id: "event-date-to" },
  time: { label: "Heure", id: "event-time" },
  location: { label: "Lieu", id: "event-location" },
  responsible_name: { label: "Responsable", id: "event-responsible" },
  responsible_email: {
    label: "E-mail du responsable",
    id: "event-responsible-email",
  },
  description: { label: "Description", id: "event-description" },
  link: { label: "Lien", id: "event-link" },
  is_public: { label: "Visible sur le site public", id: "event-public" },
};

const TYPE_OPTIONS = EVENT_TYPES.map((value) => ({
  value,
  label: EVENT_TYPE_LABELS[value]!,
}));

const defaults = (event?: Event | null): EventFormValues => ({
  title: event?.title ?? "",
  date_from:
    (event?.date_from ? parseIsoDate(event.date_from) : null) ??
    (undefined as never),
  date_to: (event?.date_to ? parseIsoDate(event.date_to) : null) ?? undefined,
  time: event?.time?.slice(0, 5) ?? "",
  location: event?.location ?? "",
  responsible_name: event?.responsible_name ?? "",
  responsible_email: event?.responsible_email ?? "",
  event_type: event?.event_type ?? "autre",
  link: event?.link ?? "",
  description: event?.description ?? "",
  is_public: event?.is_public ?? false,
});

export interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The event being edited; none for a creation. */
  event?: Event | null;
  /** Saves; throws when it fails. */
  onSubmit: (values: EventFormValues) => Promise<void>;
  isPending: boolean;
}

/**
 * « Ajouter un événement » / « Modifier « … » » in direction B: three
 * sections (L'événement, Organisation, Pour les membres), hints under the
 * fields, inline errors with the summary.
 */
export function EventDialog({
  open,
  onOpenChange,
  event,
  onSubmit,
  isPending,
}: EventDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: defaults(event),
    shouldFocusError: false,
  });
  const dateFrom = useWatch({ control: form.control, name: "date_from" });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(event));
  }, [open, event, form]);

  const submit = async (values: EventFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={event ? `Modifier « ${event.title} »` : "Ajouter un événement"}
      description={
        event
          ? "Les changements apparaissent dans l'agenda des membres dès l'enregistrement, et sur le site si l'événement est public."
          : "L'événement rejoint l'agenda des membres ; rendez-le public pour l'afficher aussi sur le site."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel={event ? "Enregistrer" : "Créer l'événement"}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(submit)}
          noValidate
          className="space-y-6"
        >
          <FormFeedback
            errors={form.formState.errors}
            labels={LABELS}
            submitCount={form.formState.submitCount}
            saveError={saveError}
          />

          <fieldset className="space-y-4">
            <legend className="text-[17px] leading-6 font-semibold">
              L&apos;événement
            </legend>
            <TextField
              control={form.control}
              name="title"
              id={LABELS.title.id}
              label={LABELS.title.label}
              required
              placeholder="Week-end chantant"
            />
            <SelectField
              control={form.control}
              name="event_type"
              id={LABELS.event_type.id}
              label={LABELS.event_type.label}
              options={TYPE_OPTIONS}
              hint="Un mot pour classer l'événement dans l'agenda."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField
                control={form.control}
                name="date_from"
                id={LABELS.date_from.id}
                label={LABELS.date_from.label}
                required
              />
              <DateField
                control={form.control}
                name="date_to"
                id={LABELS.date_to.id}
                label={LABELS.date_to.label}
                disabledDays={(day) =>
                  dateFrom instanceof Date ? day < dateFrom : false
                }
                hint="Seulement si l'événement dure plusieurs jours."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="time"
                id={LABELS.time.id}
                label={LABELS.time.label}
                type="time"
                required
                hint="Sur 24 heures, par exemple 09:30."
              />
              <TextField
                control={form.control}
                name="location"
                id={LABELS.location.id}
                label={LABELS.location.label}
                required
                placeholder="Mittelbergheim"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-[17px] leading-6 font-semibold">
              Organisation
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="responsible_name"
                id={LABELS.responsible_name.id}
                label={LABELS.responsible_name.label}
                required
                hint="La personne à qui s'adresser."
              />
              <TextField
                control={form.control}
                name="responsible_email"
                id={LABELS.responsible_email.id}
                label={LABELS.responsible_email.label}
                inputMode="email"
                placeholder="prenom@exemple.fr"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-[17px] leading-6 font-semibold">
              Pour les membres
            </legend>
            <TextareaField
              control={form.control}
              name="description"
              id={LABELS.description.id}
              label={LABELS.description.label}
              rows={3}
              hint="Quelques lignes : programme, ce qu'il faut apporter, horaires de rendez-vous."
            />
            <TextField
              control={form.control}
              name="link"
              id={LABELS.link.id}
              label={LABELS.link.label}
              type="url"
              inputMode="url"
              placeholder="https://"
              hint="Inscription, plan d'accès ou page de l'événement."
            />
            <SwitchField
              control={form.control}
              name="is_public"
              id={LABELS.is_public.id}
              label={LABELS.is_public.label}
              hint="Sinon, seuls les membres le voient dans leur espace et dans l'application."
            />
          </fieldset>
        </form>
      </Form>
    </FormDialog>
  );
}
